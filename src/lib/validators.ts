import type Ajv from 'ajv'
import type { Schema } from 'ajv'
import { betterAjvErrors } from '@apideck/better-ajv-errors'

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

/**
 * Validates that a value conforms to a schema. Returns a result object.
 */
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
      value: { validated: value, message: `${prefix}value conforms to ${spec}` }
    }
  }
}

interface ConformConfig<V> {
  ajv: Ajv
  schema: Schema
  data: V
}

interface ConformOptions {
  basePath?: string
  validationErrorsSeparator?: string
}

// TODO: create factory that accepts ajv and schema, and compile the schema (to avoid recompiling the schema every single time)

export const newConformResult = <V>(
  config: ConformConfig<V>,
  options?: ConformOptions
) => {
  const { ajv, schema, data } = config
  const opt = options ?? {}
  const separator = opt.validationErrorsSeparator ?? ';'

  let spec = 'schema'
  if ((schema as any).title) {
    spec = `schema '${(schema as any).title}'`
  }
  if ((schema as any).$id) {
    spec = `schema ID '${(schema as any).$id}'`
  }

  const validate = ajv.compile(schema)

  validate(data)

  if (!validate.errors) {
    return {
      value: {
        message: `value conforms to ${spec}`,
        validated: data
      }
    }
  }

  let defaultBasePath = ''
  if (typeof schema === 'boolean') {
    defaultBasePath = ''
  } else {
    if (schema.type) {
      defaultBasePath = schema.type
    }
    if (schema.title) {
      defaultBasePath = schema.title
    }
    if (schema.$id) {
      defaultBasePath = schema.$id
    }
  }

  const basePath = opt.basePath ?? defaultBasePath

  const validation_errors = betterAjvErrors({
    schema,
    data,
    errors: validate.errors,
    basePath
  })

  const errors = validation_errors.map((ve) => {
    return `${ve.message} (path: ${ve.path})`
  })

  return { error: new Error(errors.join(separator)) }
}

/**
 * Throws if a value does not conform to a schema.
 */
export const throwIfDoesNotConform = <V>(
  config: Config,
  ajv: Ajv,
  schema: Schema,
  value: V
) => {
  const { error } = newConformResult(
    { ajv, schema, data: value },
    { basePath: config.prefix, validationErrorsSeparator: ';' }
  )
  // const { error } = conformResult(config, ajv, schema, value)
  if (error) {
    throw error
  }
}
