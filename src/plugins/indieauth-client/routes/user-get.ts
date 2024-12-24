import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { APPLICATION_JSON, TEXT_HTML } from '../../../lib/content-type.js'
import {
  InvalidRequestError,
  ServerError,
  UnauthorizedError
} from '../../../lib/fastify-errors/index.js'
import { clientAcceptsHtml } from '../../../lib/fastify-request-predicates/index.js'
import { errorMessageFromJSONResponse } from '../../../lib/oauth2/error-message-from-response.js'

interface RouteGeneric extends RouteGenericInterface {
  Querystring: {
    provider: string
  }
}

export interface Options {
  userinfo_endpoint: string
  log_prefix?: string
}

export const defUserGet = (options?: Options) => {
  const opt = options ?? ({} as Options)
  const log_prefix = opt.log_prefix ?? 'user-get '
  const { userinfo_endpoint } = opt

  const userGet: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { provider } = request.query

    if (!provider) {
      throw new InvalidRequestError({
        error_description: 'Query parameter "provider" is required.'
      })
    }

    const access_token = request.session.get('access_token')

    if (!access_token) {
      const error_description = `Access token not found in session.`
      throw new UnauthorizedError({ error_description })
    }

    const response = await fetch(`${userinfo_endpoint}?provider=${provider}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${access_token}`
      }
    })

    if (!response.ok) {
      const msg = await errorMessageFromJSONResponse(response)
      const error = `Error from userinfo endpoint`
      const error_description = msg

      reply.code(response.status)

      if (clientAcceptsHtml(request)) {
        reply.header('Content-Type', TEXT_HTML)
        return reply.view('error.njk', {
          title: 'Error',
          description: 'Error page',
          error,
          error_description
        })
      } else {
        reply.header('Content-Type', APPLICATION_JSON)
        return reply.send({ error, error_description })
      }
    }

    let payload: any
    try {
      payload = await response.json()
    } catch (err: any) {
      const error_description = `Cannot parse the JSON response received from the userinfo endpoint: ${err.message}.`
      // I don't think it's the client's fault if we couldn't parse the response
      // body, so we return a generic server error.
      throw new ServerError({ error_description })
    }

    request.log.debug(`${log_prefix}render ${provider} user profile`)

    return reply.successResponse(200, {
      title: 'User',
      description: `Profile page for the user authenticated with ${provider}.`,
      summary: `Info from your authentication provider (${provider}).`,
      payload
    })
  }

  return userGet
}
