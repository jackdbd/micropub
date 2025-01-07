import { Static, Type } from '@sinclair/typebox'
import {
  me_before_url_canonicalization,
  profile,
  type Profile
} from '../indieauth/index.js'
import { failure } from '../schemas/failure.js'

const RETRIEVE_PROFILE_DESCRIPTION = `Retrieves a user's profile from storage.`

const retrieve_profile_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: profile
})

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

export type RetrieveProfile = Static<typeof retrieveProfile_>

export const retrieveProfile = Type.Any({
  description: RETRIEVE_PROFILE_DESCRIPTION
})

export type RetrieveRecord<Data extends {}, Id = string> = (
  id: Id
) => Promise<
  | { error: Error; value?: undefined }
  | { error?: undefined; value: Data | undefined }
>

export const store_profile_param = Type.Object({
  profile_url: me_before_url_canonicalization,
  ...profile.properties
})

const message = Type.String({ minLength: 1 })

const store_profile_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    id: Type.String({ minLength: 1 }),
    message: Type.Optional(message)
  })
})

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

export type StoreProfile = Static<typeof storeProfile_>

export const storeProfile = Type.Any({
  description: STORE_PROFILE_DESCRIPTION
})

export type StoreRecord<Data extends {}> = (
  data: Data
) => Promise<
  | { error: Error; value: undefined }
  | { error?: undefined; value: { id: string; message?: string } }
>

export type ProfileURL = string

export interface Data extends Profile {
  profile_url: string
}

export type ProfileTable = Record<ProfileURL, Profile>
