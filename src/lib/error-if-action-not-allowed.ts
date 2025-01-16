import type { Session, SessionData } from '@fastify/secure-session'
import { FastifyRequest } from 'fastify'
// import type { JWTPayload } from 'jose'
import type { AccessTokenClaims } from './token/index.js'
import {
  InsufficientScopeError,
  UnauthorizedError
} from './fastify-error-response/index.js'

export interface Options {
  // logPrefix?: string
  claimsSessionKey?: string
  // scopeClaimsKey: string
  sessionKey?: string
}

export const defErrorIfActionNotAllowed = (options?: Options) => {
  const opt = options ?? ({} as Options)
  // const prefix = opt.logPrefix ?? 'error-if-action-not-allowed '
  const claims_session_key = opt.claimsSessionKey ?? 'claims'
  const session_key = opt.sessionKey ?? 'session'

  const errorIfActionNotAllowed = (request: FastifyRequest, scope: string) => {
    const session = (request as any)[session_key] as Session<SessionData>

    // Consider passing this getter as a configuration option. For example, one
    // might prefer storing/retrieving the claims from a session cookie.
    // The type definition should be: () => Claims | undefined
    // const claims: JWTPayload | undefined = session.get(claims_session_key)
    const claims: AccessTokenClaims | undefined =
      session.get(claims_session_key)
    // const claims = request.session.get('claims')

    if (!claims) {
      const error_description = `Session has no access token claims`
      return new UnauthorizedError({ error_description })
    }

    const scopes = claims.scope.split(' ')

    // The Micropub server MUST require the bearer token to include at least one
    // scope value, in order to ensure posts cannot be created by arbitrary tokens.
    // https://micropub.spec.indieweb.org/#scope-p-1
    if (scopes.length < 1) {
      const error_description = `Claims found in session do not include a 'scope' claim.`
      return new InsufficientScopeError({
        error_description,
        error_uri: 'https://micropub.spec.indieweb.org/#error-response'
      })
    }

    if (!scopes.includes(scope)) {
      const error_description = `Claim 'scope' found in session does not include '${scope}'.`
      return new InsufficientScopeError({
        error_description,
        error_uri: 'https://micropub.spec.indieweb.org/#error-response'
      })
    }

    return undefined
  }

  return errorIfActionNotAllowed
}
