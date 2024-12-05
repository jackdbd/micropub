import { applyToDefaults } from '@hapi/hoek'
import type { JWK } from 'jose'
import type {
  Blacklist,
  Cleanup,
  Issue,
  Issuelist,
  Reset,
  Revoke,
  RevokeAll
} from '../micropub/store/api.js'
import type { TokenStore } from '../micropub/store/index.js'
import { randomKid, sign } from '../token/sign-jwt.js'
import { verify } from '../token/verify-jwt.js'
import {
  DEFAULT_STORE_NAME,
  DEFAULT_TOKEN_BLACKLIST,
  DEFAULT_TOKEN_EXPIRATION,
  DEFAULT_TOKEN_ISSUELIST,
  DEFAULT_TOKEN_ISSUER,
  DEFAULT_TOKEN_BLACKLIST_PATH,
  DEFAULT_TOKEN_ISSUELIST_PATH
} from './defaults.js'
import * as storage from './fs.js'

export interface FileSystemStore extends TokenStore {}

interface Log {
  debug: (...args: any) => void
  error: (...args: any) => void
}

interface Options {
  blacklist?: string[]
  blacklist_path?: string
  expiration?: string
  issuelist?: string[]
  issuelist_path?: string
  issuer?: string
  jwks: { keys: JWK[] }
  jwks_url: URL
  log?: Log
  name?: string
  prefix?: string
}

const defaults: Partial<Options> = {
  blacklist: DEFAULT_TOKEN_BLACKLIST,
  blacklist_path: DEFAULT_TOKEN_BLACKLIST_PATH,
  expiration: DEFAULT_TOKEN_EXPIRATION,
  issuelist: DEFAULT_TOKEN_ISSUELIST,
  issuelist_path: DEFAULT_TOKEN_ISSUELIST_PATH,
  issuer: DEFAULT_TOKEN_ISSUER,
  log: {
    debug: (..._args: any) => {},
    error: (..._args: any) => {}
  },
  name: DEFAULT_STORE_NAME
}

export const defStore = async (options?: Options): Promise<FileSystemStore> => {
  const opt = options || {}
  const store_cfg = applyToDefaults(defaults, opt) as Required<Options>

  const {
    blacklist_path,
    expiration,
    issuelist_path,
    issuer,
    jwks,
    jwks_url,
    log,
    name
  } = store_cfg

  const prefix = store_cfg.prefix ? store_cfg.prefix : `[${store_cfg.name}] `

  const blacklist: Blacklist = async () => {
    log.debug(`${prefix}read blacklist ${blacklist_path}`)
    const { error, value } = await storage.readJSON<string[]>(blacklist_path)
    if (error) {
      return { error }
    }
    return { value: new Set(value) }
  }

  const cleanup: Cleanup = async () => {
    log.debug(`${prefix}cleanup`)
    return await storage.cleanup({ blacklist_path, issuelist_path })
  }

  const issue: Issue = async (payload) => {
    const { error: kid_error, value: kid } = randomKid(jwks.keys)

    if (kid_error) {
      return { error: kid_error }
    }

    const { error: sign_error, value: jwt } = await sign({
      expiration,
      issuer,
      jwks,
      kid,
      payload
    })

    if (sign_error) {
      return { error: sign_error }
    }

    // We need to decode the token we have just issued because we need to store
    // its jti claim in the issuelist.
    const { error: verify_error, value: claims } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age: expiration
    })

    if (verify_error) {
      return { error: verify_error }
    }

    const { jti } = claims
    if (!jti) {
      // This should never happen, since we are required the jti claim in the
      // verify function. But better safe than sorry.
      return { error: new Error(`token was verified but it has no jti claim`) }
    }

    const { error } = await storage.appendJTI({ jti, path: issuelist_path })

    if (error) {
      return { error }
    }

    return {
      value: { message: `Issued token ${jti}`, jwt, claims }
    }
  }

  const issuelist: Issuelist = async () => {
    log.debug(`${prefix}read blacklist ${issuelist_path}`)
    const { error, value } = await storage.readJSON<string[]>(issuelist_path)
    if (error) {
      return { error }
    }
    return { value: new Set(value) }
  }

  const reset: Reset = async () => {
    log.debug(`${prefix}reset`)

    const { error, value } = await storage.reset({
      blacklist: store_cfg.blacklist,
      blacklist_path: store_cfg.blacklist_path,
      issuelist: store_cfg.issuelist,
      issuelist_path: store_cfg.issuelist_path
    })

    if (error) {
      log.error(`${prefix}cannot reset: ${error.message}`)
      return { error }
    }

    return { value }
  }

  const revoke: Revoke = async (jwt) => {
    log.debug(`${prefix}revoke token`)

    const { error: verify_error, value: claims } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age: expiration
    })

    if (verify_error) {
      log.error(`${prefix}cannot verify secret: ${verify_error.message}`)
      return { error: verify_error }
    }

    const { jti } = claims
    if (!jti) {
      return { error: new Error(`token was verified but it has no jti claim`) }
    }

    log.debug(`${prefix}revoking token that has jti claim ${jti}`)

    const { error } = await storage.appendJTI({ jti, path: blacklist_path })

    if (error) {
      return { error }
    }

    return { value: { jti, message: `Token ${jti} is now blacklisted` } }
  }

  const revokeAll: RevokeAll = async () => {
    log.debug(`${prefix}revoke all tokens`)
    const { error: read_error, value: arr } = await storage.readJSON<string[]>(
      issuelist_path
    )
    if (read_error) {
      return { error: read_error }
    }

    const { error: write_error } = await storage.writeJSON(blacklist_path, arr)
    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `Revoked all tokens` } }
  }

  const { error: init_error, value } = await storage.reset(store_cfg)

  if (init_error) {
    throw init_error
  }

  log.debug(`${prefix}initialized: ${value.message}`)

  return {
    blacklist,
    cleanup,
    info: { name },
    issue,
    issuelist,
    reset,
    revoke,
    revokeAll
  }
}
