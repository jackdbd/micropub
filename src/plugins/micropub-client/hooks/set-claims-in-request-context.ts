import type { RequestContextData } from '@fastify/request-context'
// import type { SessionData } from '@fastify/secure-session'
import type { AccessTokenClaims } from '@jackdbd/indieauth'
// import { UnauthorizedError } from '@jackdbd/oauth2-error-responses'
import type { onRequestHookHandler } from 'fastify'

declare module '@fastify/request-context' {
  interface RequestContextData {
    access_token_claims?: AccessTokenClaims
  }
}

// declare module '@fastify/secure-session' {
//   interface SessionData {
//     claims: AccessTokenClaims
//   }
// }

export interface Options {
  // includeErrorDescription?: boolean
  logPrefix?: string
  redirectPath?: string
  requestContextKey?: string
  //   sessionKey?: string
}

const defaults: Partial<Options> = {
  // includeErrorDescription: false,
  logPrefix: '[set-claims] ',
  redirectPath: '/login',
  requestContextKey: 'access_token_claims'
  //   sessionKey: 'claims'
}

export const defSetClaimsInRequestContext = (options?: Options) => {
  const config = Object.assign({}, defaults, options) as Required<Options>

  const ctx_key = config.requestContextKey as keyof RequestContextData
  //   const session_key = config.sessionKey as keyof SessionData
  const session_key = 'claims'

  const { logPrefix, redirectPath } = config

  const setClaimsInRequestContext: onRequestHookHandler = (
    request,
    reply,
    done
  ) => {
    request.log.debug(
      `${logPrefix}get access token claims from session key '${session_key}'`
    )
    const claims = request.session.get(session_key)

    if (!claims) {
      // const error_description = `No access token claims in session, under key '${session_key}'`
      // const err = new UnauthorizedError({ error_description })
      // return reply.errorResponse(
      //   err.statusCode,
      //   err.payload({ include_error_description })
      // )
      request.log.debug(
        `${logPrefix}cannot access ${request.url} because there are no access token claims in session, under key '${session_key}'; redirecting to ${redirectPath}`
      )
      return reply.redirect(redirectPath)
    }

    request.requestContext.set(ctx_key, claims)
    request.log.debug(
      `${logPrefix}access token claims are now set in request context key '${ctx_key}'`
    )

    done()
  }

  return setClaimsInRequestContext
}
