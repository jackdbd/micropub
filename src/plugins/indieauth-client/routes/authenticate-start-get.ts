import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { InvalidRequestError } from '../../../lib/fastify-errors/index.js'
import { relMeHrefs } from '../../../lib/relmeauth/index.js'

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
  // email_auth_start_path: string
  github_auth_start_path: string
  indieauth_auth_start_path: string
  indieauth_client_id: string
  indieauth_client_name: string
  // linkedin_auth_start_path: string
  log_prefix: string
  // mastodon_auth_start_path: string
}

export const defAuthenticate = (config: Config) => {
  const {
    github_auth_start_path,
    indieauth_auth_start_path,
    indieauth_client_id: client_id,
    indieauth_client_name: client_name,
    log_prefix
  } = config

  const authenticate: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { me } = request.query

    if (!me) {
      const error_description = 'Query parameter "me" is required.'
      throw new InvalidRequestError({ error_description })
    }
    // Authentication providers: IndieAuth and 3rd party OAuth2.0 providers
    // (e.g. GitHub, Facebook, LinkedIn, etc.)
    const providers: Provider[] = []

    if (client_id) {
      const text = client_name ? `${client_name} (IndieAuth)` : 'IndieAuth'
      providers.push({
        href: `${indieauth_auth_start_path}?client_id=${client_id}&me=${me}`,
        text
      })
    }

    request.log.warn(`${log_prefix}perform RelMeAuth Discovery on ${me}`)
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

    request.log.warn(
      hrefs,
      `${log_prefix}RelMeAuth Discovery: found ${hrefs.length} rel="me" links`
    )

    hrefs.forEach((str) => {
      request.log.info(`${log_prefix}found rel="me" link: ${str}`)
      if (str.includes('github.com')) {
        providers.push({ href: github_auth_start_path, text: 'GitHub' })
      } else if (str.includes('fosstodon.org')) {
        const href = '/auth/mastodon'
        providers.push({ href, text: 'Mastodon' })
      } else if (str.includes('linkedin.com')) {
        const href = '/auth/linkedin'
        providers.push({ href, text: 'LinkedIn' })
      } else if (str.includes('mailto')) {
        const href = '/auth/email'
        providers.push({ href, text: 'Email' })
      } else {
        const href = '/auth/other'
        providers.push({ href, text: 'Other' })
      }
    })

    // console.log(`=== AUTHENTICATION PROVIDERS ===`, providers)

    return reply.view('authenticate.njk', {
      title: 'Authenticate',
      description: 'Choose an authentication provider',
      me,
      providers
    })
  }

  return authenticate
}
