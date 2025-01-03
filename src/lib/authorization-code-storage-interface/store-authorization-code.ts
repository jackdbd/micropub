import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { failure } from '../schemas/failure.js'
import { conformResult } from '../validators.js'
import { code, code_record, type StoreRecord } from './schemas.js'

export const store_authorization_code_param = Type.Object({
  ...code_record.properties,
  code
})

export type StoreAuthorizationCodeParam = Static<
  typeof store_authorization_code_param
>

const DESCRIPTION =
  'Persists an authorization code to some storage (e.g. a database).'

const store_authorization_code_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({ message: Type.Optional(Type.String({ minLength: 1 })) })
})

const store_authorization_code_result_promise = Type.Promise(
  Type.Union([failure, store_authorization_code_success])
)

const storeAuthorizationCode_ = Type.Function(
  [store_authorization_code_param],
  store_authorization_code_result_promise,
  {
    $id: 'store-authorization-code',
    description: DESCRIPTION
  }
)

/**
 * Persists an authorization code to some storage (e.g. a database).
 */
export type StoreAuthorizationCode = Static<typeof storeAuthorizationCode_>

export const storeAuthorizationCode = Type.Any({
  description: DESCRIPTION
})

export interface Config {
  ajv?: Ajv
  log?: (message: string, payload?: any) => void
  prefix?: string
  report_all_ajv_errors: boolean
  storeRecord: StoreRecord
}

export const defStoreAuthorizationCode = (config: Config) => {
  const { report_all_ajv_errors, storeRecord } = config
  const log = config.log || (() => {})
  const prefix = config.prefix ?? 'store-authorization-code '

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

    const { code, ...record } = param

    log(`${prefix}store record about authorization code ${code}`, record)
    const { error: write_error } = await storeRecord(code, record)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `stored authorization code ${code}` } }
  }

  return storeAuthorizationCode
}
