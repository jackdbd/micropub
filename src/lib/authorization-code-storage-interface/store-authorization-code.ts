import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { client_id, me, redirect_uri } from '../indieauth/index.js'
import { exp } from '../jwt/index.js'
import { scope } from '../oauth2/index.js'
import { failure } from '../schemas/failure.js'
import { conformResult } from '../validators.js'
import { code, type GetRecord, type SetRecord } from './schemas.js'

export const store_authorization_code_param = Type.Object({
  client_id,
  code,
  exp,
  me,
  redirect_uri,
  scope
})

export type StoreAuthorizationCodeParam = Static<
  typeof store_authorization_code_param
>

const DESCRIPTION =
  'Function that performs the effect of persisting the authorization code to some storage (e.g. a database).'

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
 * Function that performs the effect of persisting the authorization code to
 * some storage (e.g. a database).
 */
export type StoreAuthorizationCode = Static<typeof storeAuthorizationCode_>

export const storeAuthorizationCode = Type.Any({
  description: DESCRIPTION
})

export interface Config {
  ajv?: Ajv
  getRecord: GetRecord
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors: boolean
  setRecord: SetRecord
}

export const defStoreAuthorizationCode = (config: Config) => {
  const { getRecord, report_all_ajv_errors, setRecord } = config
  //   const log = config.log || console.log
  const log = config.log || (() => {})
  const prefix = config.prefix ?? 'store-authorization-code '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const storeAuthorizationCode: StoreAuthorizationCode = async (param) => {
    log(param, `${prefix}param`)

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

    log(code, `${prefix}code`)
    const { error: read_error, value } = await getRecord(code)

    if (read_error) {
      return { error: read_error }
    }

    if (value) {
      return {
        value: { message: `authorization code ${code} has already been stored` }
      }
    }

    const { error: write_error } = await setRecord(code, record)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `issued authorization code ${code}` } }
  }

  return storeAuthorizationCode
}
