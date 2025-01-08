import { fileURLToPath } from 'node:url'
import type { ValidateFunction } from 'ajv'
import * as jose from 'jose'
import { table } from 'table'
import type { TSchema } from '@sinclair/typebox'
import * as DEFAULT from '../src/defaults.js'

const __filename = fileURLToPath(import.meta.url)

export const DEFAULT_ISSUER = __filename
export const DEFAULT_EXPIRATION = '5 minutes'

// 🚧❌🚨⛔❗
// https://emojis.wiki/
export const EMOJI = {
  AUTHORIZATION_CODE_ISSUED: '🔐',
  ERROR: '🚨',
  TOKEN_ISSUED: '🔑',
  TOKEN_REVOKED: '🚫',
  ALL_TOKENS_REVOKED: '🚧'
}

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

export const describe = (schema: TSchema) => {
  const entries = Object.entries(schema.properties).map(([key, x]) => {
    const val = JSON.stringify(x, null, 2)
    return [key, val]
  })

  const header_content = `JSON schema '${schema.title}' ($id: ${schema.$id})`

  console.log(
    table(entries, { header: { alignment: 'center', content: header_content } })
  )
  console.log('\n')
}

type Result<V> =
  | { error: Error; value?: undefined }
  | { error?: undefined; value: V }

export const unwrap = <V>(result: Result<V>) => {
  const { error, value } = result
  if (error) {
    console.error(`${EMOJI.ERROR} ${error.message}`)
    process.exit(1)
  }
  return value
}

export const unwrapPromise = async <V>(promise: Promise<Result<V>>) => {
  const result = await promise
  return unwrap(result)
}
