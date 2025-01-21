import type { RouteGenericInterface, RouteHandler } from 'fastify'
import {
  InvalidRequestError,
  ServerError,
  UnauthorizedError
} from '@jackdbd/oauth2-error-responses'
import { errorResponseFromJSONResponse } from '@jackdbd/oauth2'

interface RouteGeneric extends RouteGenericInterface {
  Querystring: {
    provider: string
  }
}

export interface Config {
  include_error_description: boolean
  log_prefix: string
  userinfo_endpoint: string
}

/**
 * Calls the userinfo endpoint and renders the information received.
 *
 * @see [Userinfo Information - IndieAuth](https://indieauth.spec.indieweb.org/#user-information)
 */
export const defUserGet = (config: Config) => {
  const { include_error_description, log_prefix, userinfo_endpoint } = config

  const userGet: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { provider } = request.query

    if (!provider) {
      const err = new InvalidRequestError({
        error_description: 'Query parameter "provider" is required.'
      })
      return reply.errorResponse(
        err.statusCode,
        err.payload({ include_error_description })
      )
    }

    const access_token = request.session.get('access_token')

    if (!access_token) {
      const error_description = `Access token not found in session.`
      const err = new UnauthorizedError({ error_description })
      return reply.errorResponse(
        err.statusCode,
        err.payload({ include_error_description })
      )
    }

    const response = await fetch(`${userinfo_endpoint}?provider=${provider}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${access_token}`
      }
    })

    if (!response.ok) {
      const err = await errorResponseFromJSONResponse(response)
      const payload = err.payload({ include_error_description })
      return reply.errorResponse(err.statusCode, payload)
    }

    let payload: any
    try {
      payload = await response.json()
    } catch (ex: any) {
      const original = ex.message
      const error_description = `Cannot parse the JSON response received from the userinfo endpoint: ${original}.`
      // I don't think it's the client's fault if we couldn't parse the response
      // body, so we return a generic server error.
      const err = new ServerError({ error_description })
      return reply.errorResponse(
        err.statusCode,
        err.payload({ include_error_description })
      )
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
