import type { RouteHandler } from 'fastify'
import { XMLParser } from 'fast-xml-parser'

import {
  errorIfMethodNotImplementedInStore,
  invalidRequest,
  normalizeJf2,
  serverError,
  type StoreUpdatePatch,
  type Syndicator
  // type SyndicatorStore
} from '../../../lib/micropub/index.js'
import type { Store } from '../../../lib/schemas/syndication.js'

export interface Config {
  include_error_description: boolean
  prefix: string
  store: Store
  syndicators: { [uid: string]: Syndicator }
}

const parser = new XMLParser()

export const defSyndicatePost = (config: Config) => {
  const { include_error_description, prefix, store, syndicators } = config

  const syndicatePost: RouteHandler = async (request, reply) => {
    // TODO: decide what request body to expect. For example:
    // 1. a URL pointing to a single post (e.g. a single note)
    // 2. a URL pointing to a feed (e.g. all notes)
    const { feed } = request.body as any
    // If it's a feed, we need to fetch it with a GET. If it's a single post, we
    // can simply check it exists using method: 'HEAD' (and then retrieve it
    // from the store).

    const response = await fetch(feed, { method: 'GET' })

    const xml = await response.text()

    const obj = parser.parse(xml)

    const feed_title = obj.feed.title
    request.log.debug(`${prefix}Feed title: ${feed_title}`)
    // const me_url = obj.feed.entry.id

    const store_error = errorIfMethodNotImplementedInStore(
      store,
      'publishedUrlToStoreLocation'
    )
    if (store_error) {
      const { code, body } = store_error
      return reply.errorResponse(code, body)
    }

    // TODO: do this for each post in the feed
    // const loc = store.publishedUrlToStoreLocation(me_url)

    // ====================================================================== //
    // Testing a bookmark-of
    // const loc = {
    //   store: 'bookmarks/test-bookmark.md',
    //   website: 'https://www.giacomodebidda.com/bookmarks/indiekit-on-indieweb/'
    // }

    // Testing a like-of
    // const loc = {
    //   store: 'likes/test-like.md',
    //   website:
    //     'https://www.giacomodebidda.com/likes/content-divorced-from-presentation/'
    // }

    // Testing a note
    const loc = {
      // store: 'notes/test-note.md',
      store: 'notes/kitesurfing-at-el-medano.md',
      // website: 'https://www.giacomodebidda.com/notes/test-note/',
      website: 'https://www.giacomodebidda.com/notes/kitesurfing-at-el-medano/'
    }
    // ====================================================================== //

    const result = await store.get(loc)

    if (result.error) {
      const title = 'Syndication error'
      const error_description = `The post published at ${loc.website} is not stored in ${store.info.name} at ${loc.store}.`
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title,
        description: 'Syndicate error page'
      })
    }

    // We assume all content retrieved from the store to be untrusted data, so
    // we normalize it and sanitize it.
    let jf2 = result.value.jf2
    request.log.debug(jf2, '=== jf2 (pre normalization) ===')
    jf2 = normalizeJf2(jf2)
    request.log.debug(jf2, '=== jf2 (after normalization) ===')

    const targets = jf2['mp-syndicate-to']
      ? (jf2['mp-syndicate-to'] as string[])
      : []

    // Testing the Telegram syndicator
    // targets.push('https://t.me/+rQSrJsu5RtgzNjM0')

    // request.log.warn(`=== syndication targets: ${targets} ===`)

    // TODO: put these calls in a queue, do not call a 3rd party service directly!
    // Also, if I enqueue the requests, I probably can't, nor need, to process
    // the results of the syndication. It's basically a set and forget operation.
    // BUT...
    // I do need to update the Micropub post from `mp-syndicate-to` to
    // `syndication`. And MAYBE also use a lock when writing on each post? Or
    // maybe wait for all syndication results, and update the post only once.
    const results = await Promise.allSettled(
      targets.map((target) => {
        const syndicator = syndicators[target]
        if (syndicator) {
          request.log.debug(
            `Try syndicating ${loc.website} to ${target} using syndicator ${syndicator.uid}`
          )
          return syndicator.syndicate(loc.website, jf2)
        } else {
          const tip = `Please provide a syndicator that can syndicate to ${target}.`
          return Promise.reject(
            `Could not syndicate ${loc.website} to target ${target} because no syndicator for that target was provided. ${tip}`
          )
        }
      })
    )

    const failures: string[] = []
    const successes: string[] = []

    const mp_syndicate_to = new Set(jf2['mp-syndicate-to'])
    const syndication = new Set(jf2.syndication)

    request.log.debug(
      {
        'mp-syndicate-to': jf2['mp-syndicate-to'],
        syndication: jf2.syndication
      },
      '=== before syndication ==='
    )

    for (const res of results) {
      if (res.status === 'rejected') {
        request.log.error(`Syndication exception: ${res.reason}`)
        failures.push(res.reason)
      } else {
        if (res.value.error) {
          const message =
            res.value.error.message ||
            'The error returned from the syndicator had no message'
          failures.push(message)
        } else {
          // console.log('=== res.value.value ===', res.value.value)
          const v = res.value.value

          let message: string
          if (v.syndication) {
            syndication.add(v.syndication)
            mp_syndicate_to.delete(v.uid)
            message = `${loc.website} syndicated to target ${v.syndication}`
          } else {
            syndication.add(v.uid)
            mp_syndicate_to.delete(v.uid)
            message = `${loc.website} syndicated to target ${v.uid}`
          }
          successes.push(message)
        }
      }
    }

    const patch: StoreUpdatePatch = {
      delete: 'mp-syndicated-to',
      replace: {
        'mp-syndicate-to': Array.from(mp_syndicate_to),
        syndication: Array.from(syndication)
      }
    }
    // request.log.warn(patch, `=== store.update patch ===`)

    const result_update = await store.update(loc.website, patch)

    if (result_update.error) {
      const error_description = result_update.error.message

      const { code, body } = serverError({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    // request.log.warn(result_update, `=== syndication store.update ===`)

    const summary = [
      `${successes.length} Successes: ${successes.join('\n')}`,
      `${failures.length} Failures: ${failures.join('\n')}`
    ].join('\n\n')

    const code = 200

    const body = {
      title: `Syndication outcome`,
      description: 'Syndicate success page',
      summary,
      payload: { successes, failures, store_update_patch: patch }
    }

    return reply.successResponse(code, body)
  }

  return syndicatePost
}