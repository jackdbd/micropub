import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  geo_uri,
  h_adr,
  h_card,
  h_cite,
  h_entry,
  h_event,
  h_geo,
  h_item
} from './microformats2/index.js'
import {
  micropub_get_request,
  micropub_post_request,
  plugin_options
} from './schemas.js'

// Do NOT use allErrors in production
// https://ajv.js.org/security.html#security-risks-of-trusted-schemas
// We need these extra formats to fully support fluent-json-schema
// https://github.com/ajv-validator/ajv-formats#formats
const ajv = addFormats(
  new Ajv({ allErrors: process.env.NODE_ENV === 'production' ? false : true }),
  [
    'date',
    'date-time',
    'email',
    'hostname',
    'ipv4',
    'ipv6',
    'json-pointer',
    'regex',
    'relative-json-pointer',
    'time',
    'uri',
    'uri-reference',
    'uri-template',
    'uuid'
  ]
)

/**
 * Compile all schemas and return validate functions.
 *
 * The order of the schemas is important, because some schemas reference other.
 */
export const compileSchemasAndGetValidateFunctions = () => {
  const validateGeoURI = ajv.compile(geo_uri)
  const validateH_geo = ajv.compile(h_geo)
  const validateH_adr = ajv.compile(h_adr)
  const validateH_card = ajv.compile(h_card)
  const validateH_cite = ajv.compile(h_cite)
  const validateH_entry = ajv.compile(h_entry)
  const validateH_event = ajv.compile(h_event)
  const validateH_item = ajv.compile(h_item)

  const validatePluginOptions = ajv.compile(plugin_options)

  const validateMicropubGetRequest = ajv.compile(micropub_get_request)
  const validateMicropubPostRequest = ajv.compile(micropub_post_request)

  return {
    validateGeoURI,
    validateH_adr,
    validateH_card,
    validateH_cite,
    validateH_entry,
    validateH_event,
    validateH_geo,
    validateH_item,
    validatePluginOptions,
    validateMicropubGetRequest,
    validateMicropubPostRequest
  }
}
