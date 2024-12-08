import { fileURLToPath } from 'node:url'
import type { ValidateFunction } from 'ajv'
import { table } from 'table'
import type { TSchema } from '@sinclair/typebox'
import * as DEFAULT from '../src/defaults.js'

const __filename = fileURLToPath(import.meta.url)

export const DEFAULT_ISSUER = __filename
export const DEFAULT_EXPIRATION = '5 minutes'

const jwks_private = DEFAULT.JWKS
if (!jwks_private) {
  throw new Error('JWKS not set')
}
export const JWKS = JSON.parse(jwks_private)

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
