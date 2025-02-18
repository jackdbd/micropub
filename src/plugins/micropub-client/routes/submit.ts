import { errorResponseFromJSONResponse } from '@jackdbd/indieauth'
// import { normalizeJf2 } from '@jackdbd/micropub'
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

    const headers = {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }

    if (
      (request.body as any).h &&
      headers['Content-Type'] &&
      headers['Content-Type'].includes('application/json')
    ) {
      throw new Error(
        `${logPrefix}Cannot use 'h' property in JSON requests. Use application/x-www-form-urlencoded instead.`
      )
    }

    if (
      (request.body as any).type &&
      headers['Content-Type'] &&
      headers['Content-Type'].includes('application/x-www-form-urlencoded')
    ) {
      throw new Error(
        `${logPrefix}Cannot use 'h' property in JSON requests. Use application/json instead.`
      )
    }

    let body: any
    const obj: { jf2?: any; urlencoded?: any } = {}
    if (
      headers['Content-Type'] &&
      headers['Content-Type'].includes('application/json')
    ) {
      obj.jf2 = stringify(request.body)
      body = obj.jf2
    } else {
      const params = new URLSearchParams(request.body as any)
      body = params

      // we do this only for logging the "urlencoded" params later
      obj.urlencoded = {}
      for (const [key, value] of params.entries()) {
        obj.urlencoded[key] = value
      }
    }

    // In alternative, always use application/json and do the urlencoded => JF2
    // conversion here.
    // let body: any
    // if (
    //   headers['Content-Type'] &&
    //   headers['Content-Type'].includes('application/x-www-form-urlencoded')
    // ) {
    //   headers['Content-Type'] = 'application/json; charset=UTF-8'
    //   body = normalizeJf2(request.body as any)
    //   body = stringify(body)
    // }

    // For troubleshooting
    request.log.warn(
      {
        urlencoded: obj.urlencoded,
        jf2: obj.jf2,
        content_type: headers['Content-Type']
      },
      `${logPrefix}urlencoded => JF2`
    )

    const response = await fetch(micropubEndpoint, {
      method: 'POST',
      body,
      headers
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
