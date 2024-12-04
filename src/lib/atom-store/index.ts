import { defAtom } from '@thi.ng/atom'
import { applyToDefaults } from '@hapi/hoek'
import type {
  Init,
  Issue,
  Revoke,
  RevokeAll,
  SetSecret
} from '../micropub/store/api.js'
import type { TokenStore } from '../micropub/store/index.js'
import { secret as defSecret, sign, verify, type Secret } from '../token.js'
import {
  DEFAULT_STORE_NAME,
  DEFAULT_TOKEN_ALGORITHM,
  DEFAULT_TOKEN_BLACKLIST,
  DEFAULT_TOKEN_EXPIRATION,
  DEFAULT_TOKEN_ISSUELIST,
  DEFAULT_TOKEN_ISSUER
} from './defaults.js'

export interface AtomStore extends TokenStore {}

interface Log {
  debug: (...args: any) => void
  error: (...args: any) => void
}

interface Options {
  algorithm?: string
  blacklist?: string[]
  expiration?: string
  issuelist?: string[]
  issuer?: string
  log?: Log
  name?: string
}

const defaults: Partial<Options> = {
  algorithm: DEFAULT_TOKEN_ALGORITHM,
  blacklist: DEFAULT_TOKEN_BLACKLIST,
  expiration: DEFAULT_TOKEN_EXPIRATION,
  issuelist: DEFAULT_TOKEN_ISSUELIST,
  issuer: DEFAULT_TOKEN_ISSUER,
  //   log: {
  //     debug: console.debug,
  //     error: console.error
  //   },
  log: {
    debug: (..._args: any) => {},
    error: (..._args: any) => {}
  },
  name: DEFAULT_STORE_NAME
}

export const defStore = (options?: Options): AtomStore => {
  const opt = options || {}
  const store_cfg = applyToDefaults(defaults, opt) as Required<Options>

  const { log, name } = store_cfg

  const a = defAtom({
    blacklist: new Set(store_cfg.blacklist),
    issuelist: new Set(store_cfg.issuelist),
    secret: undefined as Secret | undefined
  })

  const setSecret: SetSecret = async (cfg = {}) => {
    const alg = cfg.algorithm || store_cfg.algorithm

    const { error, value } = await defSecret({ alg })

    if (error) {
      return { error: new Error(`Could not set secret: ${error.message}`) }
    }

    a.resetIn(['secret'], value)

    return { value: { message: `Generated secret using algorithm ${alg}` } }
  }

  const init: Init = async () => {
    log.debug(`Initialize store ${name}`)

    const { error: secret_error } = await setSecret({
      algorithm: store_cfg.algorithm
    })

    if (secret_error) {
      log.error(`Could not set secret: ${secret_error.message}`)
      return { error: secret_error }
    }

    return { value: { message: `Store ${name} initialized` } }
  }

  const issue: Issue = async (cfg) => {
    const algorithm = cfg.algorithm || store_cfg.algorithm
    const expiration = cfg.expiration || store_cfg.expiration
    const issuer = cfg.issuer || store_cfg.issuer

    let secret = a.deref().secret

    if (!secret) {
      return {
        error: new Error(`Store ${name} has no secret. Set a secret first.`)
      }
    }

    const payload = cfg.payload

    const { error: sign_error, value: jwt } = await sign({
      algorithm,
      expiration,
      issuer,
      payload,
      secret
    })

    if (sign_error) {
      return { error: sign_error }
    }

    // We need to decode the token we have just issued because we need to store
    // its jti claim in the issuelist.
    const { error: verify_error, value: decoded } = await verify({
      expiration,
      issuer,
      jwt,
      secret
    })

    if (verify_error) {
      return { error: verify_error }
    }

    const jti = decoded.payload.jti
    if (!jti) {
      return { error: new Error(`Token has no jti claim`) }
    }

    a.swapIn(['issuelist'], (issuelist) => {
      issuelist.add(jti)
      return issuelist
    })

    return {
      value: { message: `Issued token ${jti}`, jwt, claims: decoded.payload }
    }
  }

  const revoke: Revoke = async (cfg) => {
    const expiration = cfg.expiration || store_cfg.expiration
    const issuer = cfg.issuer || store_cfg.issuer

    let secret = a.deref().secret

    if (!secret) {
      return {
        error: new Error(`Store ${name} has no secret. Set a secret first.`)
      }
    }

    const jwt = cfg.jwt

    const { error, value } = await verify({ expiration, issuer, jwt, secret })

    if (error) {
      return { error }
    }

    const { jti } = value.payload

    if (!jti) {
      return { error: new Error(`Token has no jti claim`) }
    }

    log.debug(`Revoking token that has jti claim ${jti}`)

    a.swapIn(['blacklist'], (blacklist) => {
      blacklist.add(jti)
      return blacklist
    })

    return { value: { jti, message: `Token ${jti} is now blacklisted` } }
  }

  const revokeAll: RevokeAll = async () => {
    let before = 0
    let after = 0

    a.swap((state) => {
      //   return { ...state, blacklist: new Set(state.issuelist) }
      before = state.blacklist.size
      state.blacklist = new Set(state.issuelist)
      after = state.blacklist.size
      return state
    })

    log.debug(a.deref(), `Current state of ${name}`)

    return Promise.resolve({
      value: {
        blacklist: a.deref().blacklist,
        blacklist_size: { before, after },
        // message: `Revoked all tokens`
        message: `Revoked ${after - before} tokens`
      }
    })
  }

  return {
    blacklist: async () => a.deref().blacklist,
    info: { name },
    init,
    issue,
    issuelist: async () => a.deref().issuelist,
    revoke,
    revokeAll,
    setSecret
  }
}
