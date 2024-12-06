import type Ajv from 'ajv'
import type { Schema } from 'ajv'

export const validationErrors = <V>(ajv: Ajv, schema: Schema, value: V) => {
  const validate = ajv.compile(schema)

  validate(value)

  if (validate.errors) {
    const errors = validate.errors.map((err) => {
      return `${err.instancePath.slice(1)} ${err.message}`
    })
    return errors
  } else {
    return [] as string[]
  }
}

interface Config {
  prefix?: string
}

export const conformResult = <V>(
  config: Config,
  ajv: Ajv,
  schema: Schema,
  value: V
) => {
  const prefix = config.prefix ?? ''
  const errors = validationErrors(ajv, schema, value)

  let spec = 'schema'
  if ((schema as any).title) {
    spec = `schema '${(schema as any).title}'`
  }
  if ((schema as any).$id) {
    spec = `schema ID '${(schema as any).$id}'`
  }

  if (errors.length > 0) {
    return {
      error: new Error(
        `${prefix}value does not conform to ${spec}: ${errors.join('; ')}`
      )
    }
  } else {
    return {
      value: {
        message: `${prefix}value conforms to ${spec}`
      }
    }
  }
}

export const throwIfDoesNotConform = <V>(
  config: Config,
  ajv: Ajv,
  schema: Schema,
  value: V
) => {
  const { error } = conformResult(config, ajv, schema, value)
  if (error) {
    throw error
  }
}
