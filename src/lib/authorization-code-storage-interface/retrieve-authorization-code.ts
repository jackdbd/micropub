import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { client_id, me, redirect_uri } from '../indieauth/index.js'
import { exp } from '../jwt/index.js'
import { scope } from '../oauth2/index.js'
import { failure } from '../schemas/failure.js'
import { conformResult } from '../validators.js'
import { code as code_schema, type GetRecord } from './schemas.js'

const retrieve_authorization_code_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({ client_id, exp, me, redirect_uri, scope })
})

const retrieve_authorization_code_result_promise = Type.Promise(
  Type.Union([failure, retrieve_authorization_code_success])
)

const DESCRIPTION = 'Retrieves an authorization code from storage.'

export const retrieveAuthorizationCode_ = Type.Function(
  [code_schema],
  retrieve_authorization_code_result_promise,
  {
    $id: 'retrieve-authorization-code',
    description: DESCRIPTION
  }
)

/**
 * Retrieves an authorization code from storage.
 */
export type RetrieveAuthorizationCode = Static<
  typeof retrieveAuthorizationCode_
>

export const retrieveAuthorizationCode = Type.Any({ description: DESCRIPTION })

export interface Config {
  ajv?: Ajv
  getRecord: GetRecord
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { getRecord, report_all_ajv_errors } = config
  //   const log = config.log || console.log
  const log = config.log || (() => {})
  const prefix = config.prefix ?? 'retrieve-authorization-code '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const retrieveAuthorizationCode: RetrieveAuthorizationCode = async (code) => {
    log(code, `${prefix}code`)

    const { error } = conformResult({ prefix }, ajv, code_schema, code)

    if (error) {
      return { error }
    }

    const { error: read_error, value: record } = await getRecord(code)

    if (read_error) {
      return { error: read_error }
    }

    if (!record) {
      return {
        error: new Error(
          `code ${code} not found among issued authorization codes`
        )
      }
    }

    return { value: record }
  }

  return retrieveAuthorizationCode
}
