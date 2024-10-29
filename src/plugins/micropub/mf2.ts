import Ajv from 'ajv'
import {
  geo_uri,
  h_adr,
  h_card,
  h_cite,
  h_entry,
  h_event,
  h_geo,
  h_item
} from '../../lib/microformats2/index.js'

/**
 * Compile all schemas and return validate functions.
 *
 * The order of the schemas is important because some schemas reference other
 * ones.
 */
export const defValidateMicroformats2 = (ajv: Ajv) => {
  const validateGeoURI = ajv.compile(geo_uri)
  const validateH_geo = ajv.compile(h_geo)
  const validateH_adr = ajv.compile(h_adr)
  const validateH_card = ajv.compile(h_card)
  const validateH_cite = ajv.compile(h_cite)
  const validateH_entry = ajv.compile(h_entry)
  const validateH_event = ajv.compile(h_event)
  const validateH_item = ajv.compile(h_item)

  return {
    validateGeoURI,
    validateH_adr,
    validateH_card,
    validateH_cite,
    validateH_entry,
    validateH_event,
    validateH_geo,
    validateH_item
  }
}
