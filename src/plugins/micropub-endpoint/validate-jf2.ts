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
import {
  mp_card,
  mp_cite,
  mp_entry,
  mp_event
} from '../../lib/micropub/index.js'

/**
 * Compile all schemas and return validate functions.
 *
 * The order of the schemas is important because some schemas reference other
 * ones.
 */
export const defValidateJf2 = (ajv: Ajv) => {
  // const label = 'compile microformats2 schemas'
  // console.time(label)

  const validateGeoURI = ajv.compile(geo_uri)
  const validateGeo = ajv.compile(h_geo)
  const validateAdr = ajv.compile(h_adr)
  const validateCard = ajv.compile(h_card)
  const validateCite = ajv.compile(h_cite)
  const validateEntry = ajv.compile(h_entry)
  const validateEvent = ajv.compile(h_event)
  const validateItem = ajv.compile(h_item)

  const validateMicropubCard = ajv.compile(mp_card)
  const validateMicropubCite = ajv.compile(mp_cite)
  const validateMicropubEntry = ajv.compile(mp_entry)
  const validateMicropubEvent = ajv.compile(mp_event)

  // console.timeLog(label)
  // console.timeEnd(label)

  return {
    validateAdr,
    validateCard,
    validateCite,
    validateEntry,
    validateEvent,
    validateGeo,
    validateGeoURI,
    validateItem,
    validateMicropubCard,
    validateMicropubCite,
    validateMicropubEntry,
    validateMicropubEvent
  }
}
