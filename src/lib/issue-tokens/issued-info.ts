import { Type, type Static } from '@sinclair/typebox'
import type { Ajv } from 'ajv'
import {
  client_id,
  issuer,
  me_after_url_canonicalization
} from '@jackdbd/indieauth'
import { exp, jti } from '../jwt/index.js'
import { jwks_private } from '../jwks/index.js'
import {
  access_token,
  expires_in,
  redirect_uri,
  refresh_token,
  scope
} from '@jackdbd/oauth2'
import { safeDecode, type AccessTokenClaims } from '../token/index.js'
import { conformResult } from '@jackdbd/schema-validators'
import { accessToken } from './access-token.js'
import { DEFAULT } from './defaults.js'
import { refreshToken } from './refresh-token.js'
import { expiration, logger } from './schemas.js'

export const config_schema = Type.Object({
  access_token_expiration: expiration,
  client_id,
  issuer,
  jwks: jwks_private,
  log: Type.Optional(logger),
  me: me_after_url_canonicalization,
  redirect_uri,
  refresh_token_expiration: expiration,
  scope
})

export interface Config extends Static<typeof config_schema> {
  ajv: Ajv
}

export const issued_info = Type.Object(
  {
    access_token,
    access_token_expires_in: expires_in,
    client_id,
    issuer,
    jti,
    me: me_after_url_canonicalization,
    redirect_uri,
    refresh_token,
    refresh_token_expires_at: exp,
    scope
  },
  {
    $id: 'issued-info',
    additionalProperties: false,
    title: 'Issued Info',
    description:
      'Access token, refresh token, and some additional information about them'
    // examples: [],
  }
)

export type ReturnValue = Static<typeof issued_info>

/**
 * Issues an access token and a refresh token. Returns both tokens and some
 * additional information about the issued tokens.
 */
export const issuedInfo = async (config: Config) => {
  const ajv = config.ajv
  const log = config.log ?? DEFAULT.log

  const { error: config_conform_error, value: config_validated } =
    conformResult(
      {
        ajv,
        schema: config_schema,
        data: config
      },
      { basePath: 'issuedInfo-config' }
    )

  if (config_conform_error) {
    return { error: config_conform_error }
  }

  const {
    access_token_expiration,
    client_id,
    issuer,
    jwks,
    me,
    redirect_uri,
    refresh_token_expiration,
    scope
  } = config_validated.validated

  const { error: access_token_error, value: access_token_value } =
    await accessToken({
      ajv,
      expiration: access_token_expiration,
      issuer,
      log,
      jwks,
      me,
      scope
    })

  if (access_token_error) {
    return { error: access_token_error }
  }

  const { access_token, expires_in } = access_token_value

  const { error: decode_error, value: claims } =
    await safeDecode<AccessTokenClaims>(access_token)

  if (decode_error) {
    return { error: decode_error }
  }

  const { jti } = claims

  const { error: refresh_token_error, value: refresh_token_value } =
    await refreshToken({
      ajv,
      expiration: refresh_token_expiration,
      log
    })

  if (refresh_token_error) {
    return { error: refresh_token_error }
  }

  const { refresh_token, exp: refresh_token_expires_at } = refresh_token_value

  const data = {
    access_token,
    access_token_expires_in: expires_in,
    client_id,
    issuer,
    jti,
    me,
    redirect_uri,
    refresh_token,
    refresh_token_expires_at,
    scope
  }

  const { error: return_value_conform_error, value: return_value_validated } =
    conformResult(
      {
        ajv,
        schema: issued_info,
        data
      },
      { basePath: 'issuedInfo-return-value' }
    )

  if (return_value_conform_error) {
    return { error: return_value_conform_error }
  }

  return { value: return_value_validated.validated }
}
