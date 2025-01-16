import { Type, type Static } from '@sinclair/typebox'
import type { Ajv } from 'ajv'
import ms, { StringValue } from 'ms'
import { randomKid, sign } from '../token/index.js'
import { jwks_private } from '../jwks/index.js'
import { issuer, me_after_url_canonicalization } from '../indieauth/index.js'
import { access_token, expires_in, scope } from '../oauth2/index.js'
import { newConformResult } from '../validators.js'
import { DEFAULT } from './defaults.js'
import { expiration, logger } from './schemas.js'

export const config_schema = Type.Object(
  {
    ajv: Type.Any(),
    expiration,
    issuer,
    jwks: jwks_private,
    log: Type.Optional(logger),
    me: me_after_url_canonicalization,
    scope
  },
  { additionalProperties: false }
)

export interface Config extends Static<typeof config_schema> {
  ajv: Ajv
}

export const return_value_schema = Type.Object(
  {
    access_token,
    expires_in
  },
  { additionalProperties: false }
)

export type ReturnValue = Static<typeof return_value_schema>

export const accessToken = async (config: Config) => {
  const ajv = config.ajv

  const { error: config_conform_error, value: config_validated } =
    newConformResult(
      {
        ajv,
        schema: config_schema,
        data: config
      },
      { basePath: 'accessToken-config' }
    )

  if (config_conform_error) {
    return { error: config_conform_error }
  }

  const { expiration, issuer, jwks, me, scope } = config_validated.validated

  const log = config_validated.validated.log ?? DEFAULT.log

  const { error: kid_error, value: kid } = randomKid(jwks.keys)

  if (kid_error) {
    return { error: kid_error }
  }

  log.debug(`use JWK ID ${kid} to sign the JWT`)

  const { error: sign_error, value: access_token } = await sign({
    expiration,
    issuer,
    jwks,
    kid,
    payload: { me, scope }
  })

  if (sign_error) {
    return { error: sign_error }
  }

  const expires_in = Math.floor(ms(expiration as StringValue) / 1000)
  log.debug(
    `access token signed by issuer ${issuer}, can access resources owned by ${me} (expires in ${expires_in} seconds)`
  )

  const value = { access_token, expires_in }
  const { error: return_value_conform_error, value: return_value_validated } =
    newConformResult(
      {
        ajv,
        schema: return_value_schema,
        data: value
      },
      { basePath: 'accessToken-return-value' }
    )

  if (return_value_conform_error) {
    return { error: return_value_conform_error }
  }

  return {
    value: return_value_validated.validated
  }
}
