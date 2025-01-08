import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { rowid, type StoreRecord } from '../crud.js'
import {
  me_after_url_canonicalization,
  me_before_url_canonicalization,
  profile
} from '../indieauth/index.js'
import { canonicalUrl } from '../url-canonicalization.js'
import { type Failure, message } from '../schemas/index.js'
import { conformResult } from '../validators.js'

export const store_profile_param = Type.Object({
  ...profile.properties,
  me: me_before_url_canonicalization
})

export type StoreProfileParam = Static<typeof store_profile_param>

const store_profile_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    me: me_after_url_canonicalization,
    message: Type.Optional(message),
    rowid: Type.Optional(rowid)
  })
})

export type StoreProfileSuccess = Static<typeof store_profile_success>

// const store_profile_result_promise = Type.Promise(
//   Type.Union([failure, store_profile_success])
// )

const description = `Stores a user's profile to storage.`

// const storeProfile_ = Type.Function(
//   [store_profile_param],
//   store_profile_result_promise,
//   {
//     $id: 'store-profile',
//     description
//   }
// )

export const storeProfile = Type.Any({ description })

export type StoreProfile = (
  param: StoreProfileParam
) => Promise<Failure | StoreProfileSuccess>

export interface Config {
  ajv?: Ajv
  report_all_ajv_errors: boolean
  storeRecord: StoreRecord<StoreProfileParam>
}

export const defStoreProfile = (config: Config) => {
  const { report_all_ajv_errors, storeRecord } = config

  const prefix = 'store-profile '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
      'email',
      'uri'
    ])
  }

  const storeProfile: StoreProfile = async (datum) => {
    const { error: param_error } = conformResult(
      { prefix },
      ajv,
      store_profile_param,
      datum
    )

    if (param_error) {
      return { error: param_error }
    }

    const { me: me_before, ...profile } = datum

    const me = canonicalUrl(me_before)

    const { error: me_error } = conformResult(
      { prefix },
      ajv,
      me_after_url_canonicalization,
      me
    )

    if (me_error) {
      return { error: me_error }
    }

    const { error: store_error, value } = await storeRecord({
      ...profile,
      me
    })

    if (store_error) {
      return { error: store_error }
    }

    const { message, rowid } = value

    return {
      value: { me, message, rowid }
    }
  }

  return storeProfile
}
