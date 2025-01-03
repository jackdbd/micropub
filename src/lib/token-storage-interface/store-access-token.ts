import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { jti } from '../jwt/index.js'
import { failure } from '../schemas/failure.js'
import { conformResult } from '../validators.js'
import {
  access_token_record,
  type RetrieveAccessTokenRecord,
  type StoreAccessTokenRecord
} from './schemas.js'

export const store_access_token_param = Type.Object({
  ...access_token_record.properties,
  jti
})

const store_access_token_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({ message: Type.Optional(Type.String({ minLength: 1 })) })
})

const store_access_token_result_promise = Type.Promise(
  Type.Union([failure, store_access_token_success])
)

const DESCRIPTION =
  'Persists an access token to some storage (e.g. a database).'

const storeAccessToken_ = Type.Function(
  [store_access_token_param],
  store_access_token_result_promise,
  {
    $id: 'store-access-token',
    description: DESCRIPTION
  }
)

/**
 * Persists an access token to some storage (e.g. a database).
 */
export type StoreAccessToken = Static<typeof storeAccessToken_>

export const storeAccessToken = Type.Any({ description: DESCRIPTION })

export interface Config {
  ajv?: Ajv
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors: boolean
  retrieveRecord: RetrieveAccessTokenRecord
  storeRecord: StoreAccessTokenRecord
}

// TODO: decide what to do if the record already exists. Myabe allow configuring
// the behavior using options?

export const defStoreAccessToken = (config: Config) => {
  const { report_all_ajv_errors, storeRecord } = config
  //   const log = config.log || console.log
  const log = config.log || (() => {})
  const prefix = config.prefix ?? 'store-access-token '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const storeAccessToken: StoreAccessToken = async (param) => {
    log(param, `${prefix}param`)

    const { error } = conformResult(
      { prefix },
      ajv,
      store_access_token_param,
      param
    )

    if (error) {
      return { error }
    }

    const { jti, ...record } = param

    log(jti, `${prefix}jti`)
    // const { error: read_error, value } = await retrieveRecord(jti)

    // if (read_error) {
    //   return { error: read_error }
    // }

    // if (value) {
    //   return {
    //     value: { message: `access token jti ${jti} has already been stored` }
    //   }
    // }

    const { error: write_error } = await storeRecord(jti, record)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `stored access token jti ${jti}` } }
  }

  return storeAccessToken
}
