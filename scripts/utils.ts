import { fileURLToPath } from 'node:url'
import type { ValidateFunction } from 'ajv'
import c from 'ansi-colors'
import * as jose from 'jose'
import ms, { StringValue } from 'ms'
import * as DEFAULT from '../src/defaults.js'
import { unixTimestampInMs } from '../src/lib/date.js'
import { EMOJI } from './emojis.js'

const __filename = fileURLToPath(import.meta.url)

export const DEFAULT_ISSUER = __filename

const jwks_private = DEFAULT.JWKS
if (!jwks_private) {
  throw new Error('JWKS not set')
}
export const JWKS = JSON.parse(jwks_private)

export const privateJWKS = async () => {
  // In some environments (e.g. Fly.io) we need to set JWKS as an escaped JSON
  // string (e.g. "{\"keys\":[]}"). So in those environments we need to call
  // JSON.parse twice to build the actual JS object.
  let jwks: { keys: jose.JWK[] } = JSON.parse(DEFAULT.JWKS!)
  if (typeof jwks === 'string') {
    jwks = JSON.parse(jwks)
  }
  return jwks
}

export const check = (what: string, value: any, validate: ValidateFunction) => {
  const valid = validate(value)
  console.log(`is '${what}' valid?`, valid)

  // console.log('value after validation (and after defaults when Ajv useDefaults: true)')
  // console.log(value)

  if (validate.errors) {
    validate.errors.forEach((error, i) => {
      console.error(`❌ validation error ${i + 1} in '${what}'`, error)
    })
  }
}

export const exp = (expiration: string) => {
  return Math.floor(
    (unixTimestampInMs() + ms(expiration as StringValue)) / 1000
  )
}

export const exitOne = (message: string) => {
  console.error(c.red(`${EMOJI.EXIT_ONE} ${message}`))
  process.exit(1)
}

export const exitZero = (message: string) => {
  console.log(c.green(`${EMOJI.EXIT_ZERO} ${message}`))
  process.exit(0)
}
