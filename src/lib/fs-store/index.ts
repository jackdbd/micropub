import fs from 'node:fs/promises'
import * as jose from 'jose'
import { applyToDefaults } from '@hapi/hoek'
import type {
  Init,
  Issue,
  Revoke,
  RevokeAll,
  SetSecret
} from '../micropub/store/api.js'
import type { TokenStore } from '../micropub/store/index.js'
import { secret as defSecret, sign, verify } from '../token.js'
import {
  DEFAULT_STORE_NAME,
  DEFAULT_TOKEN_ALGORITHM,
  DEFAULT_TOKEN_BLACKLIST,
  DEFAULT_TOKEN_EXPIRATION,
  DEFAULT_TOKEN_ISSUELIST,
  DEFAULT_TOKEN_ISSUER,
  DEFAULT_TOKEN_BLACKLIST_PATH,
  DEFAULT_TOKEN_ISSUELIST_PATH,
  DEFAULT_TOKEN_JWK_PATH
} from './defaults.js'

export interface FileSystemStore extends TokenStore {}

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
  jwk_path?: string
  log?: Log
  name?: string
  blacklist_path?: string
  issuelist_path?: string
}

const defaults: Partial<Options> = {
  algorithm: DEFAULT_TOKEN_ALGORITHM,
  blacklist: DEFAULT_TOKEN_BLACKLIST,
  blacklist_path: DEFAULT_TOKEN_BLACKLIST_PATH,
  expiration: DEFAULT_TOKEN_EXPIRATION,
  issuelist: DEFAULT_TOKEN_ISSUELIST,
  issuelist_path: DEFAULT_TOKEN_ISSUELIST_PATH,
  issuer: DEFAULT_TOKEN_ISSUER,
  jwk_path: DEFAULT_TOKEN_JWK_PATH,
  log: {
    debug: (..._args: any) => {},
    error: (..._args: any) => {}
  },
  name: DEFAULT_STORE_NAME
}

interface AppendJTIConfig {
  jti: string
  path: string
}

interface GetSecretConfig {
  algorithm: string
  jwk_path: string
}

const writeJSON = async (filepath: string, data: any) => {
  try {
    await fs.writeFile(filepath, JSON.stringify(data), 'utf8')
    return { value: { message: `Wrote ${filepath}` } }
  } catch (err: any) {
    return { error: err as Error }
  }
}

export const defStore = (options?: Options): FileSystemStore => {
  const opt = options || {}
  const store_cfg = applyToDefaults(defaults, opt) as Required<Options>

  const { blacklist_path, issuelist_path, jwk_path, log, name } = store_cfg

  const setSecret: SetSecret = async (cfg = {}) => {
    const alg = cfg.algorithm || store_cfg.algorithm

    const { error: secret_error, value: secret_key } = await defSecret({ alg })

    if (secret_error) {
      return {
        error: new Error(`Could not generate secret: ${secret_error.message}`)
      }
    }

    log.debug(`Generated secret using algorithm ${alg}`)

    let jwk: jose.JWK
    try {
      jwk = await jose.exportJWK(secret_key)
    } catch (err: any) {
      return { error: err as Error }
    }

    const { error } = await writeJSON(jwk_path, { ...jwk, alg })

    if (error) {
      log.error(error.message)
      return { error }
    }

    const message = `Stored ${alg} JWK at ${jwk_path}`
    log.debug(message)

    return { value: { message } }
  }

  const init: Init = async () => {
    log.debug(`Initialize store ${name}`)

    const { error: blacklist_error } = await writeJSON(
      blacklist_path,
      store_cfg.blacklist
    )
    if (blacklist_error) {
      log.error(
        `Could not stored blacklist at ${blacklist_path}: ${blacklist_error.message}`
      )
      return { error: blacklist_error }
    }
    log.debug(`Stored blacklist at ${blacklist_path}`)

    let { error: issuelist_error } = await writeJSON(
      issuelist_path,
      store_cfg.issuelist
    )
    if (issuelist_error) {
      log.error(
        `Could not stored issuelist at ${issuelist_path}: ${issuelist_error.message}`
      )
      return { error: issuelist_error }
    }
    log.debug(`Stored issuelist at ${issuelist_path}`)

    const { error: secret_error } = await setSecret({
      algorithm: store_cfg.algorithm
    })
    if (secret_error) {
      log.error(`Could not set secret: ${secret_error.message}`)
      return { error: secret_error }
    }

    return { value: { message: `Store ${name} initialized` } }
  }

  const readJWK = async (jwk_path: string) => {
    try {
      const jwk_data = await fs.readFile(jwk_path, { encoding: 'utf8' })
      return { value: JSON.parse(jwk_data) as jose.JWK }
    } catch (err: any) {
      const message = `Could not read JWK from ${jwk_path}: ${err.message}`
      return { error: new Error(message) }
    }
  }

  const importJWK = async (jwk: jose.JWK, algorithm: string) => {
    try {
      const keylike = await jose.importJWK(jwk, algorithm)
      return { value: keylike as jose.KeyLike | Uint8Array }
    } catch (err: any) {
      const message = `Could not import JWK from ${jwk_path}: ${err.message}`
      return { error: new Error(message) }
    }
  }

  const getSecret = async (cfg: GetSecretConfig) => {
    const { algorithm, jwk_path } = cfg

    const { error: read_error, value: jwk } = await readJWK(jwk_path)

    if (read_error) {
      log.error(read_error.message)
      return { error: read_error }
    }

    const { error: import_error, value } = await importJWK(jwk, algorithm)

    if (import_error) {
      log.error(import_error.message)
      return { error: import_error }
    }

    return { value }
  }

  const appendJTI = async (cfg: AppendJTIConfig) => {
    try {
      const json = await fs.readFile(cfg.path, 'utf8')
      const arr = JSON.parse(json)
      arr.push(cfg.jti)
      await fs.writeFile(cfg.path, JSON.stringify(arr), 'utf8')
      return { value: { message: `jti ${cfg.jti} written to ${cfg.path}` } }
    } catch (err: any) {
      return { error: err as Error }
    }
  }

  const blacklistArray = async () => {
    const json = await fs.readFile(blacklist_path, { encoding: 'utf8' })
    return JSON.parse(json) as string[]
  }

  const issuelistArray = async () => {
    const json = await fs.readFile(issuelist_path, { encoding: 'utf8' })
    return JSON.parse(json) as string[]
  }

  const issue: Issue = async (cfg) => {
    const algorithm = cfg.algorithm || store_cfg.algorithm
    const expiration = cfg.expiration || store_cfg.expiration
    const issuer = cfg.issuer || store_cfg.issuer
    const payload = cfg.payload

    const { error: secret_error, value: secret } = await getSecret({
      algorithm,
      jwk_path
    })

    if (secret_error) {
      log.error(`Could not retrieve secret: ${secret_error.message}`)
      return { error: secret_error }
    }

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

    const { error } = await appendJTI({ jti, path: issuelist_path })

    if (error) {
      return { error }
    }

    return {
      value: { message: `Issued token ${jti}`, jwt, claims: decoded.payload }
    }
  }

  const revoke: Revoke = async (cfg) => {
    const algorithm = store_cfg.algorithm
    const expiration = cfg.expiration || store_cfg.expiration
    const issuer = cfg.issuer || store_cfg.issuer
    const jwt = cfg.jwt

    const { error: secret_error, value: secret } = await getSecret({
      algorithm,
      jwk_path
    })

    if (secret_error) {
      log.error(`Could not retrieve secret: ${secret_error.message}`)
      return { error: secret_error }
    }

    const { error: verify_error, value } = await verify({
      expiration,
      issuer,
      jwt,
      secret
    })

    if (verify_error) {
      return { error: verify_error }
    }

    const { jti } = value.payload

    if (!jti) {
      return { error: new Error(`Token has no jti claim`) }
    }

    log.debug(`Revoking token that has jti claim ${jti}`)

    const { error } = await appendJTI({ jti, path: blacklist_path })

    if (error) {
      return { error }
    }

    return { value: { jti, message: `Token ${jti} is now blacklisted` } }
  }

  const revokeAll: RevokeAll = async () => {
    try {
      const arr = await issuelistArray()
      const { error } = await writeJSON(blacklist_path, arr)
      if (error) {
        log.error(`Could not revoke all tokens: ${error.message}`)
        return { error }
      }
      return { value: { message: `Revoked all tokens` } }
    } catch (err: any) {
      return { error: err as Error }
    }
  }

  return {
    blacklist: async () => {
      const arr = await blacklistArray()
      return new Set(arr)
    },
    cleanup: async () => {
      log.debug(`Cleanup store ${name}`)
      await fs.rm(blacklist_path)
      await fs.rm(issuelist_path)
      await fs.rm(jwk_path)
    },
    info: { name },
    init,
    issue,
    issuelist: async () => {
      const arr = await issuelistArray()
      return new Set(arr)
    },
    revoke,
    revokeAll,
    setSecret
  }
}
