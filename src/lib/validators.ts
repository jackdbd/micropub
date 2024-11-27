import type Ajv from 'ajv'
import type { Schema } from 'ajv'

export const validationErrors = <C>(ajv: Ajv, schema: Schema, config: C) => {
  const validate = ajv.compile(schema)

  validate(config)

  if (validate.errors) {
    const errors = validate.errors.map((err) => {
      return `${err.instancePath.slice(1)} ${err.message}`
    })
    return errors
  } else {
    return [] as string[]
  }
}
