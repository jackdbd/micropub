import type { Profile } from '../indieauth/index.js'

export type ProfileURL = string

export type ProfileTable = Record<ProfileURL, Profile>
