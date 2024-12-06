import { defAtom } from '@thi.ng/atom'
import { applyToDefaults } from '@hapi/hoek'
import type { JWK } from 'jose'
import type {
  Blacklist,
  Issue,
  Issuelist,
  Reset,
  Revoke,
  RevokeAll
} from '../micropub/store/api.js'
import type { TokenStore } from '../micropub/store/index.js'
import type { Introspection } from '../schemas/introspection.js'
import { randomKid, sign } from '../token/sign-jwt.js'
import { verify } from '../token/verify-jwt.js'
import {
  DEFAULT_STORE_NAME,
  DEFAULT_TOKEN_BLACKLIST,
  DEFAULT_TOKEN_EXPIRATION,
  DEFAULT_TOKEN_ISSUELIST,
  DEFAULT_TOKEN_ISSUER
} from './defaults.js'

export interface AtomStore extends Introspection, TokenStore {}

interface Log {
  debug: (...args: any) => void
  error: (...args: any) => void
}

interface Options {
  blacklist?: string[]
  expiration?: string
  issuelist?: string[]
  issuer?: string
  jwks: { keys: JWK[] }
  jwks_url: URL
  log?: Log
  name?: string
  prefix?: string
}

const defaults: Partial<Options> = {
  blacklist: DEFAULT_TOKEN_BLACKLIST,
  expiration: DEFAULT_TOKEN_EXPIRATION,
  issuelist: DEFAULT_TOKEN_ISSUELIST,
  issuer: DEFAULT_TOKEN_ISSUER,
  log: {
    debug: (..._args: any) => {},
    error: (..._args: any) => {}
  },
  name: DEFAULT_STORE_NAME
}

export const defStore = async (options?: Options): Promise<AtomStore> => {
  const opt = options || {}
  const store_cfg = applyToDefaults(defaults, opt) as Required<Options>

  const { expiration, issuer, jwks, jwks_url, log, name } = store_cfg

  const prefix = store_cfg.prefix ? store_cfg.prefix : `[${store_cfg.name}] `

  const a = defAtom({
    blacklist: new Set(store_cfg.blacklist),
    issuelist: new Set(store_cfg.issuelist)
  })

  const blacklist: Blacklist = async () => {
    return { value: a.deref().blacklist }
  }

  const isBlacklisted = async (jti: string) => {
    const { error, value: blacklist_set } = await blacklist()
    if (error) {
      return { error }
    }

    const value = (blacklist_set as Set<string>).has(jti)

    return { value }
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

    a.swapIn(['issuelist'], (issuelist) => {
      issuelist.add(jti)
      return issuelist
    })

    return {
      value: { message: `Issued token ${jti}`, jwt, claims }
    }
  }

  const issuelist: Issuelist = async () => {
    return { value: a.deref().issuelist }
  }

  const reset: Reset = async () => {
    log.debug(`${prefix}reset`)

    a.reset({
      blacklist: new Set(store_cfg.blacklist),
      issuelist: new Set(store_cfg.issuelist)
    })

    return { value: { message: `Store ${name} has been reset` } }
  }

  const revoke: Revoke = async (jwt) => {
    const expiration = store_cfg.expiration
    const issuer = store_cfg.issuer
    log.debug(
      `${prefix}revoke token (issuer: ${issuer}, expiration: ${expiration})`
    )

    const { error: verify_error, value: claims } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age: expiration
    })

    if (verify_error) {
      log.error(`${prefix}cannot verify token: ${verify_error.message}`)
      return { error: verify_error }
    }

    const { jti } = claims
    if (!jti) {
      return { error: new Error(`token was verified but it has no jti claim`) }
    }

    log.debug(`${prefix}revoking token that has jti claim ${jti}`)

    a.swapIn(['blacklist'], (blacklist) => {
      blacklist.add(jti)
      return blacklist
    })

    return { value: { jti, message: `Token ${jti} is now blacklisted` } }
  }

  const revokeAll: RevokeAll = async () => {
    a.swap((state) => {
      return { ...state, blacklist: new Set(state.issuelist) }
    })

    return Promise.resolve({
      value: {
        message: `Revoked all tokens`
      }
    })
  }

  log.debug(`${prefix}initialized`)

  return {
    blacklist,
    info: { name },
    isBlacklisted,
    issue,
    issuelist,
    reset,
    revoke,
    revokeAll
  }
}
