import type { RouteGenericInterface, RouteHandler } from 'fastify'
import { revoke } from '../../lib/token.js'

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
  // https://indieauth.spec.indieweb.org/#error-responses
  if (!token) {
    // return (reply as any).httpErrors.unauthorized(`token is missing`)
    return reply.code(401).send({
      error: 'invalid_token',
      error_description: 'The `token` parameter is missing.'
    })
  }

  await revoke({ jwt: token })
  // const { error } = await revoke({ jwt: token })
  // if (error) {
  //   return reply.code(500).send({ error: error.message })
  // }

  return reply.code(200).send({ message: 'token revoked' })
}
