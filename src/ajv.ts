import Ajv, { type Options } from 'ajv'
import addFormats from 'ajv-formats'

export const defAjv = (options?: Options) => {
  // We would need all these extra formats to fully support fluent-json-schema.
  // https://github.com/ajv-validator/ajv-formats#formats
  // However, it seems that for this app we only need a subset of these formats.
  // See also:
  // https://json-schema.org/understanding-json-schema/reference/type
  return addFormats(new Ajv(options), [
    'date',
    'date-time',
    'double',
    'duration',
    'email',
    'float',
    // 'hostname',
    'int32',
    'int64',
    // 'ipv4',
    // 'ipv6',
    // 'json-pointer',
    // 'regex',
    // 'relative-json-pointer',
    // 'time',
    'uri'
    // 'uri-reference',
    // 'uri-template',
    // 'uuid'
  ])
}
