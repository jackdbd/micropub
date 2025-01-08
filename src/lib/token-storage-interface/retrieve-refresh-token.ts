import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { RetrieveRecord } from '../crud.js'
import { refresh_token as refresh_token_schema } from '../oauth2/index.js'
import { type Failure } from '../schemas/index.js'
import { conformResult } from '../validators.js'
import {
  refresh_token_record,
  type RefreshToken,
  type RefreshTokenRecord
} from './schemas.js'

const retrieve_refresh_token_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: refresh_token_record
})

export type RetrieveRefreshTokenSuccess = Static<
  typeof retrieve_refresh_token_success
>

// const retrieve_refresh_token_result_promise = Type.Promise(
//   Type.Union([failure, retrieve_refresh_token_success])
// )

const description = 'Retrieves a refresh token from storage.'

// export const retrieveRefreshToken_ = Type.Function(
//   [refresh_token_schema],
//   retrieve_refresh_token_result_promise,
//   {
//     $id: 'retrieve-refresh-token',
//     description
//   }
// )

export type RetrieveRefreshToken = (
  refresh_token: string
) => Promise<Failure | RetrieveRefreshTokenSuccess>

/**
 * Retrieves a refresh token from storage.
 */
// export type RetrieveRefreshToken = Static<typeof retrieveRefreshToken_>

export const retrieveRefreshToken = Type.Any({ description })

export type RetrieveRefreshTokenRecord = (
  refresh_token: RefreshToken
) => Promise<
  | { error: Error; value: undefined }
  | { error: undefined; value: RefreshTokenRecord | undefined }
>

export interface Config {
  ajv?: Ajv
  report_all_ajv_errors?: boolean
  retrieveRecord: RetrieveRecord<RefreshTokenRecord, string>
}

export const defRetrieveRefreshToken = (config: Config) => {
  const { report_all_ajv_errors, retrieveRecord } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const retrieveRefreshToken: RetrieveRefreshToken = async (refresh_token) => {
    const { error } = conformResult(
      { prefix: 'retrieve-refresh-token' },
      ajv,
      refresh_token_schema,
      refresh_token
    )

    if (error) {
      return { error }
    }

    const { error: retrieve_error, value: record } = await retrieveRecord(
      refresh_token
    )

    if (retrieve_error) {
      return { error: retrieve_error }
    }

    if (!record) {
      return {
        error: new Error(
          `token ${refresh_token} not found among the refresh tokens currently in storage`
        )
      }
    }

    return { value: record }
  }

  return retrieveRefreshToken
}
