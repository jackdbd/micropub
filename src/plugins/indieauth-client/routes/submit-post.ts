import type { RouteHandler } from 'fastify'
import stringify from 'fast-safe-stringify'
import { UnauthorizedError } from '../../../lib/fastify-errors/index.js'

export interface Config {
  log_prefix: string
  micropub_endpoint: string
}

export const defSubmit = (config: Config) => {
  const { log_prefix, micropub_endpoint } = config

  const submit: RouteHandler = async (request, reply) => {
    const access_token = request.session.get('access_token')

    if (!access_token) {
      const error_description = `Access token not found in session.`
      throw new UnauthorizedError({ error_description })
    }

    request.log.debug(`${log_prefix}access token extracted from session`)

    const response = await fetch(micropub_endpoint, {
      method: 'POST',
      body: stringify(request.body),
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (response.status === 202) {
      const location = response.headers.get('Location')
      request.log.debug(`${log_prefix}Redirecting to /accepted`)
      const uri = `/accepted?data=${encodeURIComponent(
        stringify({ ...data, location }, undefined, 2)
      )}`

      return reply.redirect(uri)
    } else {
      request.log.debug(`${log_prefix}Redirecting to /created`)

      const uri = `/created?data=${encodeURIComponent(
        stringify(data, undefined, 2)
      )}`
      return reply.redirect(uri)
    }
  }

  return submit
}
