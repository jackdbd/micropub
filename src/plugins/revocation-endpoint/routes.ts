import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { revoke } from '../../lib/token.js'
import { invalid_token } from './errors.js'

interface RequestBody {
  token: string
}

interface RouteGeneric extends RouteGenericInterface {
  Body: RequestBody
}

/**
 * https://indieauth.spec.indieweb.org/#token-revocation
 */
export const revocation: RouteHandler<RouteGeneric> = async (
  request,
  reply
) => {
  if (!request.body) {
    return reply.badRequest('missing request body')
  }

  const { token } = request.body

  if (!token) {
    return reply
      .code(invalid_token.code)
      .send(invalid_token.payload('The `token` parameter is missing.'))
  }

  await revoke({ jwt: token })
  // const { error } = await revoke({ jwt: token })
  // if (error) {
  //   return reply.code(500).send({ error: error.message })
  // }

  return reply
    .code(501)
    .send({ message: 'token revocation not yet implemented by this server' })
}
