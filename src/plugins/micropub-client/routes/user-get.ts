import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { errorResponseFromJSONResponse } from '@jackdbd/indieauth'
import { ServerError, UnauthorizedError } from '@jackdbd/oauth2-error-responses'

interface RouteGeneric extends RouteGenericInterface {
  Querystring: {
    provider: string
  }
}

export interface Config {
  includeErrorDescription: boolean
  logPrefix: string
  userinfoEndpoint: string
}

/**
 * Calls the userinfo endpoint and renders the information received.
 *
 * @see [Userinfo Information - IndieAuth](https://indieauth.spec.indieweb.org/#user-information)
 */
export const defUserGet = (config: Config) => {
  const {
    includeErrorDescription: include_error_description,
    logPrefix,
    userinfoEndpoint
  } = config

  const userGet: RouteHandler<RouteGeneric> = async (request, reply) => {
    // const { provider } = request.query

    // if (!provider) {
    //   const err = new InvalidRequestError({
    //     error_description: 'Query parameter "provider" is required.'
    //   })
    //   return reply.errorResponse(
    //     err.statusCode,
    //     err.payload({ include_error_description })
    //   )
    // }

    const access_token = request.session.get('access_token')

    if (!access_token) {
      const error_description = `Access token not found in session.`
      const err = new UnauthorizedError({ error_description })
      return reply.errorResponse(
        err.statusCode,
        err.payload({ include_error_description })
      )
    }

    const response = await fetch(userinfoEndpoint, {
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

    request.log.debug(`${logPrefix}render user profile`)

    return reply.successResponse(200, {
      title: 'User',
      description: `User's profile page.`,
      // description: `Profile page for the user authenticated with ${provider}.`,
      // summary: `Info from your authentication provider (${provider}).`,
      summary: `Info retrieved from the userinfo endpoint ${userinfoEndpoint}.`,
      payload
    })
  }

  return userGet
}
