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
import { InvalidTokenError } from '@jackdbd/oauth2-error-responses'
import type { onRequestAsyncHookHandler } from 'fastify'

export interface Options {
  clientId?: string
  isAccessTokenRevoked: IsAccessTokenRevoked
  logPrefix?: string
  sessionKeyAccessToken?: keyof SessionData
  sessionKeyClaims?: keyof SessionData
  sessionKeyRefreshToken?: keyof SessionData
  tokenEndpoint?: string
}

const defaults: Partial<Options> = {
  logPrefix: '[refresh-tokens] ',
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
    _reply
  ) => {
    request.log.debug(
      `${logPrefix}get access token claims from session key '${session_key_claims}'`
    )
    const claims = request.session.get(session_key_claims)
    if (!claims) {
      request.log.debug(`${logPrefix}no access token claims in session`)
      return
    }

    const { exp, jti, scope } = claims as AccessTokenClaims

    const exp_utc = msToUTCString(exp * 1000)
    const now = unixTimestampInMs()
    const now_utc = msToUTCString(now)

    const expired = isExpired(exp)
    if (expired) {
      request.log.info(
        { exp, exp_utc, now, now_utc },
        `${logPrefix}access token is expired, so it will be refreshed now`
      )
    } else {
      request.log.info(
        { exp, exp_utc, now, now_utc },
        `${logPrefix}no need to refresh access token, since it's not expired`
      )
      return
    }

    request.log.debug(`${logPrefix}checking if jti '${jti}' is revoked`)
    let revoked = false
    try {
      revoked = await isAccessTokenRevoked(jti)
    } catch (ex: any) {
      request.log.error(`${logPrefix}${ex.message}`)
      return
    }

    if (revoked) {
      request.log.warn(`${logPrefix}access Token jti=${jti} is revoked`)
      return
    }

    request.log.debug(
      `${logPrefix}get refresh token claims from session key '${session_key_refresh_token}'`
    )
    const refresh_token = request.session.get(session_key_refresh_token)
    if (!refresh_token) {
      request.log.debug(`${logPrefix}no refresh token in session`)
      return
    }

    // Perform a refresh request to the token endpoint. The new access token
    // will have the same scope as the previous one.
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
      request.log.error(`${logPrefix}${ex.message}`)
      return
    }

    if (!response.ok) {
      const err = await errorResponseFromJSONResponse(response)
      const payload = err.payload({ include_error_description: true })
      request.log.warn(
        `${logPrefix}${payload.error}: ${payload.error_description}`
      )
      return
    }

    let refreshed_access_token: string | undefined
    let refreshed_refresh_token: string | undefined
    try {
      const res_body = await response.json()
      refreshed_access_token = res_body.access_token
      refreshed_refresh_token = res_body.refresh_token
    } catch (ex: any) {
      const error_description = `failed to parse the JSON response received from the token endpoint: ${ex.message}`
      request.log.error(`${logPrefix}${error_description}`)
      return
    }

    if (!refreshed_access_token) {
      request.log.warn(
        `${logPrefix}access token not found in response from token endpoint ${tokenEndpoint}`
      )
      return
    }

    if (!refreshed_refresh_token) {
      request.log.warn(
        `${logPrefix}refresh token not found in response from token endpoint ${tokenEndpoint}`
      )
      return
    }

    const { error: decode_error, value: refreshed_claims } =
      await safeDecode<AccessTokenClaims>(refreshed_access_token)

    if (decode_error) {
      const error_description = `error while decoding access token: ${decode_error.message}`
      const err = new InvalidTokenError({ error_description })
      const payload = err.payload({ include_error_description: true })
      request.log.warn(
        `${logPrefix}${payload.error}: ${payload.error_description}`
      )
      return
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
