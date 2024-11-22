import type { onRequestHookHandler } from 'fastify'

export const validateAuthorizationHeader: onRequestHookHandler = (
  request,
  reply,
  done
) => {
  const auth = request.headers.authorization

  if (!auth) {
    const message = 'missing Authorization header'
    request.log.warn(message)
    return reply.micropubUnauthorized(message)
  }

  if (auth.indexOf('Bearer') === -1) {
    const message = 'missing Bearer in Authorization header'
    request.log.warn(message)
    return reply.micropubUnauthorized(message)
  }

  done()
}
