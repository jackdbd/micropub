import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { rowid, type StoreRecord } from '../crud.js'
import { jti } from '../jwt/index.js'
import { type Failure, message } from '../schemas/index.js'
import { conformResult } from '../validators.js'
import { access_token_record } from './schemas.js'

export const store_access_token_param = Type.Object({
  ...access_token_record.properties,
  jti
})

export type StoreAccessTokenParam = Static<typeof store_access_token_param>

const store_access_token_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    jti,
    message: Type.Optional(message),
    rowid: Type.Optional(rowid)
  })
})

export type StoreAccessTokenSuccess = Static<typeof store_access_token_success>

// const store_access_token_result_promise = Type.Promise(
//   Type.Union([failure, store_access_token_success])
// )

const description =
  'Persists an access token to some storage (e.g. a database).'

// const storeAccessToken_ = Type.Function(
//   [store_access_token_param],
//   store_access_token_result_promise,
//   {
//     $id: 'store-access-token',
//     description
//   }
// )

/**
 * Persists an access token to some storage (e.g. a database).
 */
// export type StoreAccessToken = Static<typeof storeAccessToken_>

export const storeAccessToken = Type.Any({ description })

export type StoreAccessToken = (
  datum: StoreAccessTokenParam
) => Promise<Failure | StoreAccessTokenSuccess>

export interface Config {
  ajv?: Ajv
  report_all_ajv_errors?: boolean
  storeRecord: StoreRecord<StoreAccessTokenParam>
}

export const defStoreAccessToken = (config: Config) => {
  const { report_all_ajv_errors, storeRecord } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const storeAccessToken: StoreAccessToken = async (datum) => {
    const { error } = conformResult(
      { prefix: 'store-access-token' },
      ajv,
      store_access_token_param,
      datum
    )

    if (error) {
      return { error }
    }

    const { jti } = datum

    const { error: store_error, value } = await storeRecord(datum)

    if (store_error) {
      return { error: store_error }
    }

    const { message, rowid } = value

    return { value: { jti, message, rowid } }
  }

  return storeAccessToken
}
