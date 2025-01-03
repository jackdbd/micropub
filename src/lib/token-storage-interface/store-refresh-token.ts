import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { refresh_token as refresh_token_schema } from '../oauth2/index.js'
import { failure } from '../schemas/failure.js'
import { conformResult } from '../validators.js'
import {
  refresh_token_record,
  type RetrieveRefreshTokenRecord,
  type StoreRefreshTokenRecord
} from './schemas.js'

export const store_refresh_token_param = Type.Object({
  ...refresh_token_record.properties,
  refresh_token: refresh_token_schema
})

const store_refresh_token_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({ message: Type.Optional(Type.String({ minLength: 1 })) })
})

const store_refresh_token_result_promise = Type.Promise(
  Type.Union([failure, store_refresh_token_success])
)

const DESCRIPTION =
  'Persists a refresh token to some storage (e.g. a database).'

const storeRefreshToken_ = Type.Function(
  [store_refresh_token_param],
  store_refresh_token_result_promise,
  {
    $id: 'store-refresh-token',
    description: DESCRIPTION
  }
)

/**
 * Persists a refresh token to some storage (e.g. a database).
 */
export type StoreRefreshToken = Static<typeof storeRefreshToken_>

export const storeRefreshToken = Type.Any({ description: DESCRIPTION })

export interface Config {
  ajv?: Ajv
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors: boolean
  retrieveRecord: RetrieveRefreshTokenRecord
  storeRecord: StoreRefreshTokenRecord
}

// TODO: decide what to do if the record already exists. Myabe allow configuring
// the behavior using options?

export const defStoreRefreshToken = (config: Config) => {
  const { report_all_ajv_errors, storeRecord } = config
  //   const log = config.log || console.log
  const log = config.log || (() => {})
  const prefix = config.prefix ?? 'store-refresh-token '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const storeRefreshToken: StoreRefreshToken = async (param) => {
    log(param, `${prefix}param`)

    const { error } = conformResult(
      { prefix },
      ajv,
      store_refresh_token_param,
      param
    )

    if (error) {
      return { error }
    }

    const { refresh_token, ...record } = param

    log(refresh_token, `${prefix}refresh_token`)
    // const { error: read_error, value } = await retrieveRecord(refresh_token)

    // if (read_error) {
    //   return { error: read_error }
    // }

    // if (value) {
    //   return {
    //     value: {
    //       message: `refresh token ${refresh_token} has already been stored`
    //     }
    //   }
    // }

    const { error: write_error } = await storeRecord(refresh_token, record)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `stored refresh token ${refresh_token}` } }
  }

  return storeRefreshToken
}
