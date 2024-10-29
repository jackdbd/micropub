import type { onRequestHookHandler } from 'fastify'

export const validateAuthorizationHeader: onRequestHookHandler = (
  request,
  reply,
  done
) => {
  const auth = request.headers.authorization

  if (!auth) {
    request.log.warn(`request ID ${request.id} has no 'Authorization' header`)
    return reply.code(401).send({
      error: '`Authorization` header is missing.'
    })
  }

  if (auth.indexOf('Bearer') === -1) {
    request.log.warn(
      `request ID ${request.id} has no 'Bearer' in Authorization header`
    )
    return reply
      .code(401)
      .send({ error: `Bearer in Authorization header is missing.` })
  }

  done()
}
