import { Static, Type } from '@sinclair/typebox'
import {
  me_after_url_canonicalization,
  me_before_url_canonicalization,
  profile,
  type Profile
} from '../indieauth/index.js'
import { failure, type Failure } from '../schemas/failure.js'
import { rowid } from '../crud.js'

const RETRIEVE_PROFILE_DESCRIPTION = `Retrieves a user's profile from storage.`

const retrieve_profile_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: profile
})

export type RetrieveProfileSuccess = Static<typeof retrieve_profile_success>

const retrieve_profile_result_promise = Type.Promise(
  Type.Union([failure, retrieve_profile_success])
)

export const retrieveProfile_ = Type.Function(
  [me_before_url_canonicalization],
  retrieve_profile_result_promise,
  {
    $id: 'retrieve-profile',
    description: RETRIEVE_PROFILE_DESCRIPTION
  }
)

export type RetrieveProfile = (
  me_before_url_canonicalization: string
) => Promise<Failure | RetrieveProfileSuccess>

export const retrieveProfile = Type.Any({
  description: RETRIEVE_PROFILE_DESCRIPTION
})

export const store_profile_param = Type.Object({
  me: me_before_url_canonicalization,
  ...profile.properties
})

const message = Type.String({ minLength: 1 })

const store_profile_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    me: me_after_url_canonicalization,
    message: Type.Optional(message),
    rowid: Type.Optional(rowid)
  })
})

export type StoreProfileSuccess = Static<typeof store_profile_success>

const store_profile_result_promise = Type.Promise(
  Type.Union([failure, store_profile_success])
)

const STORE_PROFILE_DESCRIPTION = `Stores a user's profile to storage.`

export const storeProfile_ = Type.Function(
  [store_profile_param],
  store_profile_result_promise,
  {
    $id: 'store-profile',
    description: STORE_PROFILE_DESCRIPTION
  }
)

export const storeProfile = Type.Any({
  description: STORE_PROFILE_DESCRIPTION
})

export interface Datum extends Profile {
  me: string
}

export type StoreProfile = (
  datum: Datum
) => Promise<Failure | StoreProfileSuccess>

export type ProfileURL = string

export type ProfileTable = Record<ProfileURL, Profile>
