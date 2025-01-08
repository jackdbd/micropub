import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { rowid, StoreRecord } from '../crud.js'
import { refresh_token as refresh_token_schema } from '../oauth2/index.js'
import { type Failure, message } from '../schemas/index.js'
import { conformResult } from '../validators.js'
import { refresh_token_record } from './schemas.js'

export const store_refresh_token_param = Type.Object({
  ...refresh_token_record.properties,
  refresh_token: refresh_token_schema
})

export type StoreRefreshTokenParam = Static<typeof store_refresh_token_param>

const store_refresh_token_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    refresh_token: refresh_token_schema,
    message: Type.Optional(message),
    rowid: Type.Optional(rowid)
  })
})

export type StoreRefreshTokenSuccess = Static<
  typeof store_refresh_token_success
>

// const store_refresh_token_result_promise = Type.Promise(
//   Type.Union([failure, store_refresh_token_success])
// )

const description =
  'Persists a refresh token to some storage (e.g. a database).'

// const storeRefreshToken_ = Type.Function(
//   [store_refresh_token_param],
//   store_refresh_token_result_promise,
//   {
//     $id: 'store-refresh-token',
//     description
//   }
// )

/**
 * Persists a refresh token to some storage (e.g. a database).
 */
// export type StoreRefreshToken = Static<typeof storeRefreshToken_>

export const storeRefreshToken = Type.Any({ description })

export type StoreRefreshToken = (
  datum: StoreRefreshTokenParam
) => Promise<Failure | StoreRefreshTokenSuccess>

// export type StoreRefreshTokenRecord = StoreRecord<StoreRefreshTokenParam>

// export type StoreRefreshTokenRecord = <
//   V extends BaseStoreRecordValue = BaseStoreRecordValue
// >(
//   datum: StoreRefreshTokenParam
// ) => Promise<
//   { error: Error; value?: undefined } | { error?: undefined; value: V }
// >

export interface Config {
  ajv?: Ajv
  report_all_ajv_errors?: boolean
  storeRecord: StoreRecord<StoreRefreshTokenParam>
}

// TODO: decide what to do if the record already exists. Myabe allow configuring
// the behavior using options?

export const defStoreRefreshToken = (config: Config) => {
  const { report_all_ajv_errors, storeRecord } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const storeRefreshToken: StoreRefreshToken = async (datum) => {
    const { error } = conformResult(
      { prefix: 'store-refresh-token' },
      ajv,
      store_refresh_token_param,
      datum
    )

    if (error) {
      return { error }
    }

    const { refresh_token } = datum

    const { error: store_error, value } = await storeRecord(datum)

    if (store_error) {
      return { error: store_error }
    }

    const { message, rowid } = value

    return { value: { refresh_token, message, rowid } }
  }

  return storeRefreshToken
}
