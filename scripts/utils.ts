import { table } from 'table'
import type { ValidateFunction } from 'ajv'
import type { TSchema } from '@sinclair/typebox'

export const check = (what: string, value: any, validate: ValidateFunction) => {
  const valid = validate(value)
  console.log(`is '${what}' valid?`, valid)

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
