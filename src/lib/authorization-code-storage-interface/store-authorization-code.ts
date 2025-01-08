import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { rowid, type StoreRecord } from '../crud.js'
import { type Failure, message } from '../schemas/index.js'
import { conformResult } from '../validators.js'
import { code, code_record } from './schemas.js'

export const store_authorization_code_param = Type.Object({
  ...code_record.properties,
  code
})

export type StoreAuthorizationCodeParam = Static<
  typeof store_authorization_code_param
>

const description =
  'Persists an authorization code to some storage (e.g. a database).'

const store_authorization_code_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    code,
    message: Type.Optional(message),
    rowid: Type.Optional(rowid)
  })
})

export type StoreAuthorizationCodeSuccess = Static<
  typeof store_authorization_code_success
>

// const store_authorization_code_result_promise = Type.Promise(
//   Type.Union([failure, store_authorization_code_success])
// )

// const storeAuthorizationCode_ = Type.Function(
//   [store_authorization_code_param],
//   store_authorization_code_result_promise,
//   {
//     $id: 'store-authorization-code',
//     description
//   }
// )

/**
 * Persists an authorization code to some storage (e.g. a database).
 */
// export type StoreAuthorizationCode = Static<typeof storeAuthorizationCode_>

export type StoreAuthorizationCode = (
  datum: StoreAuthorizationCodeParam
) => Promise<Failure | StoreAuthorizationCodeSuccess>

export const storeAuthorizationCode = Type.Any({ description })

export type StoreAuthorizationCodeRecord =
  StoreRecord<StoreAuthorizationCodeParam>

export interface Config {
  ajv?: Ajv
  report_all_ajv_errors?: boolean
  storeRecord: StoreAuthorizationCodeRecord
}

export const defStoreAuthorizationCode = (config: Config) => {
  const { report_all_ajv_errors, storeRecord } = config

  const prefix = 'store-authorization-code'

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const storeAuthorizationCode: StoreAuthorizationCode = async (param) => {
    const { error } = conformResult(
      { prefix },
      ajv,
      store_authorization_code_param,
      param
    )

    if (error) {
      return { error }
    }

    const { error: write_error, value } = await storeRecord(param)

    if (write_error) {
      return { error: write_error }
    }

    const { message, rowid } = value

    return { value: { code: param.code, rowid, message } }
  }

  return storeAuthorizationCode
}
