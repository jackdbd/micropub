import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { failure } from '../schemas/failure.js'
import { conformResult } from '../validators.js'
import {
  code as code_schema,
  type GetRecord,
  type SetRecord
} from './schemas.js'

const DESCRIPTION = 'Marks an authorization code as used.'

const mark_code_as_used_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({ message: Type.Optional(Type.String({ minLength: 1 })) })
})

const mark_code_as_used_result_promise = Type.Promise(
  Type.Union([failure, mark_code_as_used_success])
)

export const markAuthorizationCodeAsUsed_ = Type.Function(
  [code_schema],
  mark_code_as_used_result_promise,
  {
    $id: 'mark-authorization-code-as-used',
    description: DESCRIPTION
  }
)

/**
 * Marks an authorization code as used.
 */
export type MarkAuthorizationCodeAsUsed = Static<
  typeof markAuthorizationCodeAsUsed_
>

export const markAuthorizationCodeAsUsed = Type.Any({
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

export const defMarkAuthorizationCodeAsUsed = (config: Config) => {
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

  const markAuthorizationCodeAsUsed: MarkAuthorizationCodeAsUsed = async (
    code
  ) => {
    log(code, `${prefix}code`)

    const { error } = conformResult({ prefix }, ajv, code_schema, code)

    if (error) {
      return { error }
    }

    log(code, `${prefix}code`)
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

    const { error: write_error } = await setRecord(code, {
      ...record,
      used: true
    })

    if (write_error) {
      return { error: write_error }
    }

    return {
      value: {
        message: `code ${code} is valid and it is now marked as used`
      }
    }
  }

  return markAuthorizationCodeAsUsed
}
