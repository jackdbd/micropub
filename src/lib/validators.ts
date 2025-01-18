import type Ajv from 'ajv'
import type { Schema } from 'ajv'
import { betterAjvErrors } from '@apideck/better-ajv-errors'
import { Type } from '@sinclair/typebox'

// used to replace a function in the schema (read the comment below)
const any_value = Type.Any()

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

/**
 * Validates that a value conforms to a schema. Returns a result object.
 */
export const conformResult = <V>(
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

  // Workaround to handle functions in a schema. Here is why we need this:
  // TypeBox allows defining functions in schemas, but JSON Schema (and
  // therefore Ajv) does not support them. Ajv will throw an error if it
  // encounters a function in the schema. To address this, we replace each
  // function definition in the schema with Type.Any(), which is the most
  // generic type available in TypeBox.
  // See also:
  // https://github.com/sinclairzx81/typebox?tab=readme-ov-file#javascript-types
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (typeof value === 'function') {
      ;(schema as any).properties[key] = any_value
    }
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

// TODO: refactor this. Use the same config and options of conformResult
interface ThrowIfDoesNotConformConfig {
  prefix?: string
}

/**
 * Throws if a value does not conform to a schema.
 */
export const throwIfDoesNotConform = <V>(
  config: ThrowIfDoesNotConformConfig,
  ajv: Ajv,
  schema: Schema,
  value: V
) => {
  const { error } = conformResult(
    { ajv, schema, data: value },
    { basePath: config.prefix, validationErrorsSeparator: ';' }
  )

  if (error) {
    throw error
  }
}
