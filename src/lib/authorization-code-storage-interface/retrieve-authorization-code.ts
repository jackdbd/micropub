import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { RetrieveRecord } from '../crud.js'
import { failure } from '../schemas/index.js'
import { conformResult } from '../validators.js'
import {
  code as code_schema,
  type Code,
  code_record,
  type CodeRecord
} from './schemas.js'

const retrieve_authorization_code_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: code_record
})

const retrieve_authorization_code_result_promise = Type.Promise(
  Type.Union([failure, retrieve_authorization_code_success])
)

const description = 'Retrieves an authorization code from storage.'

export const retrieveAuthorizationCode_ = Type.Function(
  [code_schema],
  retrieve_authorization_code_result_promise,
  {
    $id: 'retrieve-authorization-code',
    description
  }
)

/**
 * Retrieves an authorization code from storage.
 */
export type RetrieveAuthorizationCode = Static<
  typeof retrieveAuthorizationCode_
>

export const retrieveAuthorizationCode = Type.Any({ description })

export type RetrieveAuthorizationCodeRecord = RetrieveRecord<CodeRecord, Code>

export interface Config {
  ajv?: Ajv
  report_all_ajv_errors?: boolean
  retrieveRecord: RetrieveAuthorizationCodeRecord
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { report_all_ajv_errors, retrieveRecord } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const retrieveAuthorizationCode: RetrieveAuthorizationCode = async (code) => {
    const { error } = conformResult(
      { prefix: 'retrieve-authorization-code' },
      ajv,
      code_schema,
      code
    )

    if (error) {
      return { error }
    }

    const { error: retrieve_error, value: record } = await retrieveRecord(code)

    if (retrieve_error) {
      return { error: retrieve_error }
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
