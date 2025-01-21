import type { Profile } from '@jackdbd/indieauth'

export type ProfileURL = string

export type ProfileTable = Record<ProfileURL, Profile>
