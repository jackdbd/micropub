import type { SessionData } from '@fastify/secure-session'
import type { IsAccessTokenRevoked } from '@jackdbd/indieauth/schemas/user-provided-functions'
import {
  errorResponseFromJSONResponse,
  isExpired,
  msToUTCString,
  safeDecode,
  unixTimestampInMs
} from '@jackdbd/indieauth'
import type { AccessTokenClaims } from '@jackdbd/indieauth'
import { InvalidTokenError, ServerError } from '@jackdbd/oauth2-error-responses'
import type { onRequestAsyncHookHandler } from 'fastify'

export interface Options {
  clientId: string
  isAccessTokenRevoked: IsAccessTokenRevoked
  logPrefix?: string
  redirectPath?: string
  sessionKeyAccessToken?: keyof SessionData
  sessionKeyClaims?: keyof SessionData
  sessionKeyRefreshToken?: keyof SessionData
  tokenEndpoint: string
}

const defaults: Partial<Options> = {
  logPrefix: '[refresh-tokens] ',
  redirectPath: '/login',
  sessionKeyAccessToken: 'access_token',
  sessionKeyClaims: 'claims',
  sessionKeyRefreshToken: 'refresh_token'
}

export const defRefreshTokensIfNeeded = (options: Options) => {
  const config = Object.assign({}, defaults, options) as Required<Options>

  const {
    clientId,
    isAccessTokenRevoked,
    logPrefix,
    redirectPath,
    sessionKeyAccessToken: session_key_access_token,
    sessionKeyClaims: session_key_claims,
    sessionKeyRefreshToken: session_key_refresh_token,
    tokenEndpoint
  } = config

  if (!clientId) {
    throw new Error('clientId is required')
  }

  if (!isAccessTokenRevoked) {
    throw new Error('isAccessTokenRevoked is required')
  }

  if (!tokenEndpoint) {
    throw new Error('tokenEndpoint is required')
  }

  const refreshTokensIfNeeded: onRequestAsyncHookHandler = async (
    request,
    reply
  ) => {
    request.log.debug(
      `${logPrefix}get refresh token from session key '${session_key_refresh_token}'`
    )
    const refresh_token = request.session.get(session_key_refresh_token)

    // If there is no refresh token in the session, we can't perform a refresh
    // request.
    if (!refresh_token) {
      request.log.warn(
        `${logPrefix}session has no refresh token, so we can't perform a refresh request; redirect to ${redirectPath}`
      )
      return reply.redirect(redirectPath)
    }

    request.log.debug(
      `${logPrefix}get access token claims from session key '${session_key_claims}'`
    )
    const claims = request.session.get(session_key_claims)

    // If there are no access token claims in the session, we don't know which
    // scope the access token had, so we don't have the necessary info required
    // to construct a refresh request.
    if (!claims) {
      request.log.warn(
        `${logPrefix}session has no access token claims, so we can't perform a refresh request; redirect to ${redirectPath}`
      )
      return reply.redirect(redirectPath)
    }

    const { exp, jti, scope } = claims as AccessTokenClaims

    // The token endpoint could have issued an invalid access token, so we need
    // to check for the presence of these claims.
    // TODO: should we redirect to login/ or throw an error if these claims are missing?
    if (!exp) {
      const error_description = `Access token claims in session do not have an 'exp' claim.`
      request.log.error(`${logPrefix}${error_description}`)
      throw new InvalidTokenError({ error_description })
    }

    if (!jti) {
      const error_description = `Access token claims in session do not have a 'jti' claim.`
      request.log.error(`${logPrefix}${error_description}`)
      throw new InvalidTokenError({ error_description })
    }

    if (!scope) {
      const error_description = `Access token claims in session do not have a 'scope' claim.`
      request.log.error(`${logPrefix}${error_description}`)
      throw new InvalidTokenError({ error_description })
    }

    request.log.debug(`${logPrefix}checking if jti '${jti}' is revoked`)
    let revoked = false
    try {
      revoked = await isAccessTokenRevoked(jti)
    } catch (ex: any) {
      let error_description = `Could not retrieve record about access token jti=${jti}.`
      if (ex && ex.message) {
        error_description = `${error_description} ${ex.message}`
      }
      // redirect to login/ or throw an error?
      // throw new ServerError({ error_description })
      return reply.redirect(redirectPath)
    }

    // If an access token has been revoked, we should not refresh it.
    if (revoked) {
      request.log.warn(
        `${logPrefix}access token jti=${jti} is revoked, so we can't perform a refresh request; redirect to ${redirectPath}`
      )
      return reply.redirect(redirectPath)
    }

    const exp_utc = msToUTCString(exp * 1000)
    const now = unixTimestampInMs()
    const now_utc = msToUTCString(now)

    const expired = isExpired(exp)

    // If the access token is still valid, we simply return (the next hook will
    // be called).
    if (!expired) {
      request.log.info(
        { exp, exp_utc, now, now_utc },
        `${logPrefix}no need to refresh access token, since it's not expired`
      )
      return
    }

    request.log.info(
      { exp, exp_utc, now, now_utc },
      `${logPrefix}access token is expired, so it will be refreshed now`
    )

    // Perform a refresh request to the token endpoint. The new access token
    // will have the same scope as the previous one.
    // TODO: should we remove the try/catch and let global error handler catch
    // any exception? It doesn't seem like we can do anything useful in the
    // catch block here.
    let response: Response
    try {
      response = await fetch(tokenEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          grant_type: 'refresh_token',
          refresh_token,
          scope
        }),
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (ex: any) {
      let error_description = `Fetch to token endpoint ${tokenEndpoint} failed.`
      if (ex && ex.message) {
        error_description = `${error_description} ${ex.message}`
      }
      request.log.error(`${logPrefix}${error_description}`)
      throw new ServerError({ error_description })
    }

    if (!response.ok) {
      const err = await errorResponseFromJSONResponse(response)
      const payload = err.payload({ include_error_description: true })
      request.log.warn(
        `${logPrefix}${payload.error}: ${payload.error_description}`
      )
      return reply.errorResponse(err.statusCode, payload)
    }

    let refreshed_access_token: string | undefined
    let refreshed_refresh_token: string | undefined
    try {
      const res_body = await response.json()
      refreshed_access_token = res_body.access_token
      refreshed_refresh_token = res_body.refresh_token
    } catch (ex: any) {
      const error_description = `Failed to parse the JSON response received from the token endpoint: ${ex.message}`
      request.log.error(`${logPrefix}${error_description}`)
      throw new ServerError({ error_description })
    }

    if (!refreshed_access_token) {
      const error_description = `Access token not found in response from token endpoint ${tokenEndpoint}.`
      request.log.warn(`${logPrefix}${error_description}`)
      throw new ServerError({ error_description })
    }

    if (!refreshed_refresh_token) {
      const error_description = `Refresh token not found in response from token endpoint ${tokenEndpoint}.`
      request.log.warn(`${logPrefix}${error_description}`)
      throw new ServerError({ error_description })
    }

    const { error: decode_error, value: refreshed_claims } =
      await safeDecode<AccessTokenClaims>(refreshed_access_token)

    if (decode_error) {
      const error_description = `Cannot decode access token: ${decode_error.message}`
      const err = new InvalidTokenError({ error_description })
      const payload = err.payload({ include_error_description: true })
      request.log.error(
        `${logPrefix}${payload.error}: ${payload.error_description}`
      )
      throw new ServerError({ error_description })
    }

    request.session.set(session_key_access_token, refreshed_access_token)
    request.log.debug(`${logPrefix}set access token in session (refreshed)`)

    request.session.set(session_key_refresh_token, refreshed_refresh_token)
    request.log.debug(`${logPrefix}set refresh token in session (refreshed)`)

    request.session.set(session_key_claims, refreshed_claims)
    request.log.debug(`${logPrefix}set decoded claims in session (refreshed)`)
  }

  return refreshTokensIfNeeded
}
