import type { Config as LibSqlClientConfig } from '@libsql/client'
import {
  ACCESS_TOKEN_EXPIRATION,
  AUTHORIZATION_CODE_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
  REPORT_ALL_AJV_ERRORS
} from '../src/defaults.js'

export const DEFAULT = {
  // ACCESS_TOKEN_EXPIRATION: '10 minutes',
  ACCESS_TOKEN_EXPIRATION,
  AUTHORIZATION_CODE_EXPIRATION,
  CLIENT_ID: 'http://localhost:3001/id',
  ME_BEFORE_CANONICALIZATION: 'giacomodebidda.com',
  ME_AFTER_CANONICALIZATION: 'https://giacomodebidda.com/',
  PROFILE_EMAIL: 'giacomo@giacomodebidda.com',
  PROFILE_NAME: 'Giacomo Debidda',
  PROFILE_PHOTO: 'https://avatars.githubusercontent.com/u/5048090',
  PROFILE_URL: 'https://www.giacomodebidda.com/',
  REDIRECT_URI: 'http://localhost:3001/auth/callback',
  REFRESH_TOKEN_EXPIRATION,
  REPORT_ALL_AJV_ERRORS,
  SCOPE: 'create update profile email',
  VERBOSE: false
}

export const DATABASES = {
  DEV: { url: 'file:micropub-dev.db' } as LibSqlClientConfig,
  PROD: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_DATABASE_TOKEN!
  } as LibSqlClientConfig
}

// 🚧❌🚨⛔❗🔐🧑🧑‍💻👤🗣️🆘🚩✅🔎
// https://emojis.wiki/
export const EMOJI = {
  ACCESS_TOKEN: '🔑',
  AUTHORIZATION_CODE: '🔢',
  DEBUG: '🔎',
  ERROR: '🚨',
  EXIT_ONE: '🚩',
  EXIT_ZERO: '🏁',
  PROFILE: '👤',
  REFRESH_TOKEN: '🌱',
  RETRIEVED: '📤',
  STORED: '📥',
  TEST: '🧪',
  TOKEN_ISSUED: '🔑',
  TOKEN_REVOKED: '🚫',
  ALL_TOKENS_REVOKED: '🚧'
}

export const LINK_BUGS = 'https://github.com/jackdbd/micropub/labels/bug'
