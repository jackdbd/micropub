import { errorResponseFromJSONResponse } from '@jackdbd/indieauth'
import { UnauthorizedError } from '@jackdbd/oauth2-error-responses'
import type { RouteHandler } from 'fastify'
import stringify from 'fast-safe-stringify'

export interface Options {
  includeErrorDescription?: boolean
  logPrefix?: string
  micropubEndpoint: string
  redirectPathOnAccepted?: string
  redirectPathOnCreated?: string
}

const defaults: Partial<Options> = {
  includeErrorDescription: false,
  logPrefix: '[submit] ',
  redirectPathOnAccepted: '/accepted',
  redirectPathOnCreated: '/created'
}

export const defSubmit = (options: Options) => {
  const config = Object.assign({}, defaults, options) as Required<Options>

  const {
    includeErrorDescription: include_error_description,
    logPrefix,
    micropubEndpoint,
    redirectPathOnAccepted,
    redirectPathOnCreated
  } = config

  if (!micropubEndpoint) {
    throw new Error('micropubEndpoint is required')
  }

  const submit: RouteHandler = async (request, reply) => {
    const access_token = request.session.get('access_token')

    if (!access_token) {
      const error_description = `Access token not found in session.`
      const err = new UnauthorizedError({ error_description })
      return reply.errorResponse(
        err.statusCode,
        err.payload({ include_error_description })
      )
    }

    request.log.debug(`${logPrefix}access token extracted from session`)

    const response = await fetch(micropubEndpoint, {
      method: 'POST',
      body: stringify(request.body),
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const err = await errorResponseFromJSONResponse(response)
      return reply.errorResponse(
        err.statusCode,
        err.payload({ include_error_description })
      )
    }

    const data = await response.json()

    if (response.status === 202) {
      const location = response.headers.get('Location')
      request.log.debug(`${logPrefix}redirecting to ${redirectPathOnAccepted}`)
      const uri = `${redirectPathOnAccepted}?data=${encodeURIComponent(
        stringify({ ...data, location }, undefined, 2)
      )}`

      return reply.redirect(uri)
    } else {
      request.log.debug(`${logPrefix}redirecting to ${redirectPathOnCreated}`)

      const uri = `${redirectPathOnCreated}?data=${encodeURIComponent(
        stringify(data, undefined, 2)
      )}`
      return reply.redirect(uri)
    }
  }

  return submit
}
