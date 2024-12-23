import type { FastifyRequest } from 'fastify'
export { defIsAuthenticated } from './is-authenticated.js'

export const clientAcceptsHtml = (request: FastifyRequest) => {
  if (request.headers.accept && request.headers.accept.includes('text/html')) {
    return true
  } else {
    return false
  }
}

export const areSameOrigin = (src: string, dest: string) => {
  return new URL(src).origin === new URL(dest).origin
}

export const hasScope = (request: FastifyRequest, scope: string) => {
  const claims = request.session.get('claims')

  if (!claims) {
    return false
  }

  const scopes = claims.scope.split(' ')

  return scopes.includes(scope) ? true : false
}
