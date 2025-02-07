import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { InvalidRequestError } from '@jackdbd/oauth2-error-responses'
// import {
//   metadataEndpoint,
//   serverMetadata
// } from '@jackdbd/indieauth'
import { relMeHrefs } from '@jackdbd/relmeauth'

interface Provider {
  href: string
  text: string
}

interface Querystring {
  me: string
}

interface RouteGeneric extends RouteGenericInterface {
  Querystring: Querystring
}

// See how it's done here:
// https://github.com/aaronpk/indielogin.com/blob/main/app/Authenticate.php

export interface Config {
  email_auth_start_path: string
  github_auth_start_path: string
  // google_auth_start_path: string
  // linkedin_auth_start_path: string
  log_prefix: string
  // mastodon_auth_start_path: string
}

/**
 * Authenticates the user using [RelMeAuth](https://indieweb.org/RelMeAuth) or
 * other authentication providers.
 */
export const defAuthenticate = (config: Config) => {
  const {
    email_auth_start_path,
    github_auth_start_path,
    // google_auth_start_path,
    // linkedin_auth_start_path,
    log_prefix
  } = config

  const authenticate: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { me } = request.query

    if (!me) {
      const error_description = 'Query parameter "me" is required.'
      throw new InvalidRequestError({ error_description })
    }

    request.session.regenerate() // clear all session data

    request.session.set('me', me)
    request.log.debug(`${log_prefix}set me=${me} in session`)

    // Authentication providers: IndieAuth and 3rd party OAuth2.0 providers
    // (e.g. GitHub, Facebook, Google, LinkedIn, etc.)
    const providers: Provider[] = []

    // TODO: re-enable IndieAuth when passkey authentication is finished.

    // request.log.debug(`${log_prefix}perform IndieAuth Discovery on ${me}`)
    // const { error: metadata_endpoint_error, value: metadata_endpoint } =
    //   await metadataEndpoint(me)

    // if (metadata_endpoint_error) {
    //   const error_description = `Found no IndieAuth metadata endpoint for profile URL ${me}.`
    //   const original = metadata_endpoint_error.message
    //   request.log.warn(`${log_prefix}${error_description} ${original}`)
    // }

    // if (metadata_endpoint) {
    //   const { error: metadata_error, value: metadata } = await serverMetadata(
    //     metadata_endpoint
    //   )

    //   if (metadata_error) {
    //     const error_description = `Cannot retrieve server metadata from ${metadata_endpoint}.`
    //     const original = metadata_error.message
    //     request.log.error(`${log_prefix}${error_description} ${original}`)
    //   }

    //   if (metadata) {
    //     request.log.debug(
    //       metadata,
    //       `${log_prefix}IndieAuth Discovery found server metadata`
    //     )

    //     providers.push({
    //       href: `${indieauth_auth_start_path}?client_id=${indieauth_client_id}&me=${me}`,
    //       text: 'IndieAuth'
    //     })
    //   }
    // }

    request.log.debug(`${log_prefix}perform RelMeAuth Discovery on ${me}`)
    const { error: rel_me_error, value: hrefs } = await relMeHrefs(me)

    if (rel_me_error) {
      const error_description = `Found no rel="me" links for profile URL ${me}.`
      const original = rel_me_error.message
      request.log.warn(`${log_prefix}${error_description} ${original}`)
      // Not having rel="me" links is not an error condition. On the other hand,
      // I think that failing to parse the HTML should be considered an error
      // (maybe it should be treated as a bug?).
      throw new InvalidRequestError({ error_description })
    }

    request.log.debug(
      hrefs,
      `${log_prefix}RelMeAuth Discovery: found ${hrefs.length} rel="me" links`
    )

    hrefs.forEach((str) => {
      request.log.debug(`${log_prefix}found rel="me" link: ${str}`)
      if (str.includes('mailto:')) {
        providers.push({ href: email_auth_start_path, text: 'Email' })
      } else if (str.includes('github.com')) {
        providers.push({ href: github_auth_start_path, text: 'GitHub' })
      } else {
        request.log.warn(`${log_prefix}provider not supported: ${str}`)
      }
      // if (str.includes('mailto:')) {
      //   providers.push({ href: email_auth_start_path, text: 'Email' })
      // } else if (str.includes('fosstodon.org')) {
      //   const href = '/auth/mastodon'
      //   providers.push({ href, text: 'Mastodon' })
      // } else if (str.includes('github.com')) {
      //   providers.push({ href: github_auth_start_path, text: 'GitHub' })
      // } else if (str.includes('google.com')) {
      //   providers.push({ href: google_auth_start_path, text: 'Google' })
      // } else if (str.includes('instagram.com')) {
      //   providers.push({ href: '/auth/instagram', text: 'Instagram' })
      // } else if (str.includes('letterboxd.com')) {
      //   providers.push({ href: '/auth/letterboxd', text: 'Letterboxd' })
      // } else if (str.includes('linkedin.com')) {
      //   const href = '/auth/linkedin'
      //   providers.push({ href, text: 'LinkedIn' })
      // } else if (str.includes('medium.com')) {
      //   providers.push({ href: '/auth/medium', text: 'Medium' })
      // } else if (str.includes('micro.blog')) {
      //   const href = '/auth/micro-blog'
      //   providers.push({ href, text: 'Micro.blog' })
      // } else if (str.includes('sms:')) {
      //   const href = '/auth/sms'
      //   providers.push({ href, text: 'SMS' })
      // } else if (str.includes('twitter.com')) {
      //   providers.push({ href: '/auth/twitter', text: 'Twitter/X' })
      // } else {
      //   const href = '/auth/other'
      //   providers.push({ href, text: 'Other' })
      // }
    })

    request.log.debug(`render authenticate.njk`)
    return reply.view('authenticate.njk', {
      title: 'Authenticate',
      description: 'Choose an authentication provider',
      me,
      providers
    })
  }

  return authenticate
}
