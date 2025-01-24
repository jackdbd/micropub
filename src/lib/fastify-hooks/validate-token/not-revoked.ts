import type { Session, SessionData } from '@fastify/secure-session'
import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import type { onRequestAsyncHookHandler } from 'fastify'
import {
  InvalidTokenError,
  UnauthorizedError
} from '@jackdbd/oauth2-error-responses'
import { safeDecode, type AccessTokenClaims } from '@jackdbd/oauth2-tokens'
import { throwWhenNotConform } from '@jackdbd/schema-validators'
import { accessTokenFromRequestHeader } from '../../fastify-utils/index.js'
import { DEFAULT } from './constants.js'
import { options as options_schema, Options } from './schemas.js'

const defaults: Partial<Options> = {
  accessTokenSessionKey: DEFAULT.ACCESS_TOKEN_SESSION_KEY,
  header: DEFAULT.HEADER,
  headerKey: DEFAULT.HEADER_KEY,
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS,
  sessionKey: DEFAULT.SESSION_KEY
}

export const defValidateAccessTokenNotRevoked = (options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const {
    accessTokenSessionKey: access_token_session_key,
    header,
    headerKey: header_key,
    isAccessTokenRevoked,
    logPrefix: prefix,
    reportAllAjvErrors: allErrors,
    sessionKey: session_key
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = new Ajv({ allErrors })
  }

  throwWhenNotConform(
    { ajv, schema: options_schema, data: config },
    { basePath: 'validate-access-token-not-revoked-options' }
  )

  const hkey = header.toLowerCase()

  const validateAccessTokenNotRevoked: onRequestAsyncHookHandler = async (
    request,
    _reply
  ) => {
    const session = (request as any)[session_key] as Session<SessionData>

    request.log.debug(
      `${prefix}get access token from session '${session_key}', key '${access_token_session_key}'`
    )

    let access_token: string | undefined = session.get(access_token_session_key)

    if (!access_token) {
      const { value } = accessTokenFromRequestHeader(request, {
        header,
        header_key
      })

      if (value) {
        access_token = value
      }
    }

    if (!access_token) {
      const error_description = `Access token not found, neither in session key '${session_key}', nor in request header '${hkey}' (in '${header_key}').`
      const error_uri = undefined
      throw new UnauthorizedError({ error_description, error_uri })
    }

    const { error: decode_error, value: claims } =
      await safeDecode<AccessTokenClaims>(access_token)

    if (decode_error) {
      const error_description = `Error while decoding access token: ${decode_error.message}`
      const error_uri = undefined
      throw new InvalidTokenError({ error_description, error_uri })
    }

    const { jti } = claims
    request.log.debug(`${prefix}validating that token ID ${jti} is not revoked`)

    let revoked = false
    try {
      revoked = await isAccessTokenRevoked(jti)
    } catch (ex: any) {
      const error_description = ex.message
      const error_uri = undefined
      throw new InvalidTokenError({ error_description, error_uri })
    }

    if (revoked) {
      const error_description = `Token ${jti} is revoked.`
      const error_uri = undefined
      throw new InvalidTokenError({ error_description, error_uri })
    }
  }

  return validateAccessTokenNotRevoked
}
