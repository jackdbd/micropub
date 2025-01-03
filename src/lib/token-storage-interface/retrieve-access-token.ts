import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { jti as jti_schema } from '../jwt/index.js'
import { failure } from '../schemas/failure.js'
import { conformResult } from '../validators.js'
import {
  access_token_record,
  type RetrieveAccessTokenRecord
} from './schemas.js'

const retrieve_access_token_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: access_token_record
})

const retrieve_access_token_result_promise = Type.Promise(
  Type.Union([failure, retrieve_access_token_success])
)

const DESCRIPTION = 'Retrieves an access token from storage.'

export const retrieveAccessToken_ = Type.Function(
  [jti_schema],
  retrieve_access_token_result_promise,
  {
    $id: 'retrieve-access-token',
    description: DESCRIPTION
  }
)

/**
 * Retrieves an access token from storage.
 */
export type RetrieveAccessToken = Static<typeof retrieveAccessToken_>

export const retrieveAccessToken = Type.Any({ description: DESCRIPTION })

export interface Config {
  ajv?: Ajv
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors: boolean
  retrieveRecord: RetrieveAccessTokenRecord
}

export const defRetrieveAccessToken = (config: Config) => {
  const { report_all_ajv_errors, retrieveRecord } = config
  //   const log = config.log || console.log
  const log = config.log || (() => {})
  const prefix = config.prefix ?? 'retrieve-access-token '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const retrieveAccessToken: RetrieveAccessToken = async (jti) => {
    log(jti, `${prefix}jti`)

    const { error } = conformResult({ prefix }, ajv, jti_schema, jti)

    if (error) {
      return { error }
    }

    const { error: read_error, value: record } = await retrieveRecord(jti)

    if (read_error) {
      return { error: read_error }
    }

    if (!record) {
      return {
        error: new Error(
          `token ${jti} not found among the stored access tokens`
        )
      }
    }

    return { value: record }
  }

  return retrieveAccessToken
}
