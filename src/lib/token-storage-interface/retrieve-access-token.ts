import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { RetrieveRecord } from '../crud.js'
import { jti as jti_schema } from '../jwt/index.js'
import { failure } from '../schemas/index.js'
import { conformResult } from '../validators.js'
import { access_token_record, type AccessTokenRecord } from './schemas.js'

const retrieve_access_token_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: access_token_record
})

const retrieve_access_token_result_promise = Type.Promise(
  Type.Union([failure, retrieve_access_token_success])
)

const description = 'Retrieves an access token from storage.'

export const retrieveAccessToken_ = Type.Function(
  [jti_schema],
  retrieve_access_token_result_promise,
  {
    $id: 'retrieve-access-token',
    description
  }
)

/**
 * Retrieves an access token from storage.
 */
export type RetrieveAccessToken = Static<typeof retrieveAccessToken_>

export const retrieveAccessToken = Type.Any({ description })

export interface Config {
  ajv?: Ajv
  report_all_ajv_errors?: boolean
  retrieveRecord: RetrieveRecord<AccessTokenRecord, string>
}

export const defRetrieveAccessToken = (config: Config) => {
  const { report_all_ajv_errors, retrieveRecord } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const retrieveAccessToken: RetrieveAccessToken = async (jti) => {
    const { error } = conformResult(
      { prefix: 'retrieve-access-token' },
      ajv,
      jti_schema,
      jti
    )

    if (error) {
      return { error }
    }

    const { error: retrieve_error, value: record } = await retrieveRecord(jti)

    if (retrieve_error) {
      return { error: retrieve_error }
    }

    if (!record) {
      return {
        error: new Error(
          `token ${jti} not found among the access tokens currently in storage`
        )
      }
    }

    return { value: record }
  }

  return retrieveAccessToken
}
