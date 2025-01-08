import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { StoreRecord } from '../crud.js'
import { me_after_url_canonicalization } from '../indieauth/index.js'
import { canonicalUrl } from '../url-canonicalization.js'
import { conformResult } from '../validators.js'
import {
  store_profile_param,
  type Datum,
  type StoreProfile
} from './schemas.js'

export interface Config {
  ajv?: Ajv
  report_all_ajv_errors: boolean
  storeRecord: StoreRecord<Datum>
}

export const defStoreProfile = (config: Config) => {
  const { report_all_ajv_errors, storeRecord } = config

  const prefix = 'store-profile '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
      'email',
      'uri'
    ])
  }

  const storeProfile: StoreProfile = async (datum) => {
    const { error: param_error } = conformResult(
      { prefix },
      ajv,
      store_profile_param,
      datum
    )

    if (param_error) {
      return { error: param_error }
    }

    const { me: me_before, ...profile } = datum

    const me = canonicalUrl(me_before)

    const { error: me_error } = conformResult(
      { prefix },
      ajv,
      me_after_url_canonicalization,
      me
    )

    if (me_error) {
      return { error: me_error }
    }

    const { error: write_error, value } = await storeRecord({
      ...profile,
      me
    })

    if (write_error) {
      return { error: write_error }
    }

    const { message, rowid } = value

    return {
      value: { me, message, rowid }
    }
  }

  return storeProfile
}
