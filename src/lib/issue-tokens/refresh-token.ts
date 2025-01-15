import { Type, type Static } from '@sinclair/typebox'
import type { Ajv } from 'ajv'
import ms, { StringValue } from 'ms'
import { nanoid } from 'nanoid'
import { exp } from '../jwt/index.js'
import { refresh_token } from '../oauth2/index.js'
import { newConformResult } from '../validators.js'
import { expiration, logger } from './schemas.js'
import { DEFAULT } from './defaults.js'
import { unixTimestampInMs } from '../date.js'

export const config_schema = Type.Object(
  {
    ajv: Type.Any(),
    expiration,
    log: Type.Optional(logger)
  },
  { additionalProperties: false }
)

export interface Config extends Static<typeof config_schema> {
  ajv: Ajv
}

export const return_value_schema = Type.Object(
  {
    exp,
    refresh_token
  },
  { additionalProperties: false }
)

export type ReturnValue = Static<typeof return_value_schema>

export const refreshToken = async (config: Config) => {
  const ajv = config.ajv

  const { error: config_conform_error, value: config_validated } =
    newConformResult(
      {
        ajv,
        schema: config_schema,
        data: config
      },
      { basePath: 'refreshToken-config' }
    )

  if (config_conform_error) {
    return { error: config_conform_error }
  }

  const { expiration } = config_validated.validated

  const log = config_validated.validated.log ?? DEFAULT.log

  const exp = Math.floor(
    (unixTimestampInMs() + ms(expiration as StringValue)) / 1000
  )

  log.debug(`refresh token expires at ${exp} (expires in ${expiration})`)

  const value = {
    refresh_token: nanoid(),
    exp
  }

  return { value }
}
