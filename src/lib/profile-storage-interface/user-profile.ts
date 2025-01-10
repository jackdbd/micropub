import { Static, Type } from '@sinclair/typebox'
import { me_after_url_canonicalization, profile } from '../indieauth/index.js'

export const user_profile_props = Type.Object(
  {
    ...profile.properties,
    me: me_after_url_canonicalization
  },
  {
    $id: 'user-profile-props',
    additionalProperties: false,
    title: 'User Profile Props',
    description: `Properties of a user's profile (a storage implementation may have addition properties)`
  }
)

export type UserProfileProps = Static<typeof user_profile_props>
