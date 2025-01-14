import { fileURLToPath } from 'node:url'
import type { Environment } from '../src/constants.js'
import {
  ACCESS_TOKEN_EXPIRATION,
  AUTHORIZATION_CODE_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
  REPORT_ALL_AJV_ERRORS
} from '../src/defaults.js'

const __filename = fileURLToPath(import.meta.url)

export const DEFAULT = {
  // ACCESS_TOKEN_EXPIRATION: '10 minutes',
  ACCESS_TOKEN_EXPIRATION,
  AUTHORIZATION_CODE_EXPIRATION,
  CLIENT_ID: 'http://localhost:3001/id',
  CODE_CHALLENGE_METHOD: 'S256',
  CODE_VERIFIER_LENGTH: 128,
  ENVIRONMENT: 'dev' as Environment,
  ISSUER: __filename,
  ME_BEFORE_CANONICALIZATION: 'giacomodebidda.com',
  ME_AFTER_CANONICALIZATION: 'https://giacomodebidda.com/',
  PROFILE_EMAIL: 'giacomo@giacomodebidda.com',
  PROFILE_NAME: 'Giacomo Debidda',
  PROFILE_PHOTO: 'https://avatars.githubusercontent.com/u/5048090',
  PROFILE_URL: 'https://www.giacomodebidda.com/',
  REDIRECT_URI: 'http://localhost:3001/auth/callback',
  REFRESH_TOKEN_EXPIRATION,
  REPORT_ALL_AJV_ERRORS,
  RESET: false,
  SCOPE: 'create update profile email',
  SHOW_SCHEMA: false,
  VERBOSE: false
}

export const LINK_BUGS = 'https://github.com/jackdbd/micropub/labels/bug'

export const INDIEAUTH_SCOPES = ['email', 'profile']

export const MICROPUB_SCOPES = [
  'create',
  'delete',
  'draft',
  'media',
  'undelete',
  'update'
]
