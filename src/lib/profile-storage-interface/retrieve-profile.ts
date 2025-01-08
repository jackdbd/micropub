import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { RetrieveRecord } from '../crud.js'
import {
  me_after_url_canonicalization,
  profile,
  type Profile
} from '../indieauth/index.js'
import { type Failure } from '../schemas/failure.js'
import { canonicalUrl } from '../url-canonicalization.js'
import { conformResult } from '../validators.js'
import type { ProfileURL } from './schemas.js'

const description = `Retrieves a user's profile from storage.`

const retrieve_profile_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: profile
})

export type RetrieveProfileSuccess = Static<typeof retrieve_profile_success>

// const retrieve_profile_result_promise = Type.Promise(
//   Type.Union([failure, retrieve_profile_success])
// )

// const retrieveProfile_ = Type.Function(
//   [me_before_url_canonicalization],
//   retrieve_profile_result_promise,
//   {
//     $id: 'retrieve-profile',
//     description
//   }
// )

export type RetrieveProfile = (
  me_before_url_canonicalization: string
) => Promise<Failure | RetrieveProfileSuccess>

export const retrieveProfile = Type.Any({ description })

export interface Config {
  ajv?: Ajv
  report_all_ajv_errors: boolean
  retrieveRecord: RetrieveRecord<Profile, ProfileURL>
}

export const defRetrieveProfile = (config: Config) => {
  const { report_all_ajv_errors, retrieveRecord } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
      'email',
      'uri'
    ])
  }

  const retrieveProfile: RetrieveProfile = async (me_before) => {
    const me = canonicalUrl(me_before)

    const { error: me_error } = conformResult(
      { prefix: 'retrieve-profile' },
      ajv,
      me_after_url_canonicalization,
      me
    )

    if (me_error) {
      return { error: me_error }
    }

    const { error: retrieve_error, value: record } = await retrieveRecord(me)

    if (retrieve_error) {
      return { error: retrieve_error }
    }

    if (!record) {
      return {
        error: new Error(`profile URL ${me} not found in storage`)
      }
    }

    return { value: record }
  }

  return retrieveProfile
}
