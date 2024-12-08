import type { RouteHandler } from 'fastify'
import stringify from 'fast-safe-stringify'

export interface Config {
  micropub_endpoint: string
  prefix: string
}

export const defSubmit = (config: Config) => {
  const { micropub_endpoint, prefix } = config

  const submit: RouteHandler = async (request, reply) => {
    const access_token = request.session.get('access_token')

    if (!access_token) {
      request.log.debug(
        `${prefix}key 'access_token' not found in session or it is undefined`
      )
      request.log.debug(`${prefix}redirect to /login`)
      return reply.redirect('/login')
    }

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
      request.log.debug(`${prefix}Redirecting to /accepted`)
      const uri = `/accepted?data=${encodeURIComponent(
        stringify({ ...data, location }, undefined, 2)
      )}`

      return reply.redirect(uri)
    } else {
      request.log.debug(`${prefix}Redirecting to /created`)

      const uri = `/created?data=${encodeURIComponent(
        stringify(data, undefined, 2)
      )}`
      return reply.redirect(uri)
    }
  }

  return submit
}
