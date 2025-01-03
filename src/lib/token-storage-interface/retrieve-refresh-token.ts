import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { refresh_token as refresh_token_schema } from '../oauth2/index.js'
import { failure } from '../schemas/failure.js'
import { conformResult } from '../validators.js'
import {
  refresh_token_record,
  type RetrieveRefreshTokenRecord
} from './schemas.js'

const retrieve_refresh_token_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: refresh_token_record
})

const retrieve_refresh_token_result_promise = Type.Promise(
  Type.Union([failure, retrieve_refresh_token_success])
)

const DESCRIPTION = 'Retrieves a refresh token from storage.'

export const retrieveRefreshToken_ = Type.Function(
  [refresh_token_schema],
  retrieve_refresh_token_result_promise,
  {
    $id: 'retrieve-refresh-token',
    description: DESCRIPTION
  }
)

/**
 * Retrieves a refresh token from storage.
 */
export type RetrieveRefreshToken = Static<typeof retrieveRefreshToken_>

export const retrieveRefreshToken = Type.Any({ description: DESCRIPTION })

export interface Config {
  ajv?: Ajv
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors: boolean
  retrieveRecord: RetrieveRefreshTokenRecord
}

export const defRetrieveRefreshToken = (config: Config) => {
  const { report_all_ajv_errors, retrieveRecord } = config
  //   const log = config.log || console.log
  const log = config.log || (() => {})
  const prefix = config.prefix ?? 'retrieve-refresh-token '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const retrieveRefreshToken: RetrieveRefreshToken = async (refresh_token) => {
    log(refresh_token, `${prefix}refresh_token`)

    const { error } = conformResult(
      { prefix },
      ajv,
      refresh_token_schema,
      refresh_token
    )

    if (error) {
      return { error }
    }

    const { error: read_error, value: record } = await retrieveRecord(
      refresh_token
    )

    if (read_error) {
      return { error: read_error }
    }

    if (!record) {
      return {
        error: new Error(
          `token ${refresh_token} not found among the stored refresh tokens`
        )
      }
    }

    return { value: record }
  }

  return retrieveRefreshToken
}
