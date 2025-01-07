import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { me_after_url_canonicalization } from '../indieauth/index.js'
import { canonicalUrl } from '../url-canonicalization.js'
import { conformResult } from '../validators.js'
import {
  type Data,
  store_profile_param,
  type StoreProfile,
  type StoreRecord
} from './schemas.js'

export interface Config {
  ajv?: Ajv
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors: boolean
  storeRecord: StoreRecord<Data>
}

export const defStoreProfile = (config: Config) => {
  const { report_all_ajv_errors, storeRecord } = config

  const log = config.log || (() => {})
  const prefix = config.prefix ?? 'store-profile '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
      'email',
      'uri'
    ])
  }

  const storeProfile: StoreProfile = async (data) => {
    const { error: param_error } = conformResult(
      { prefix },
      ajv,
      store_profile_param,
      data
    )

    if (param_error) {
      return { error: param_error }
    }

    const { profile_url, ...profile } = data

    log(profile_url, `${prefix}canonicalize URL`)
    const me = canonicalUrl(profile_url)

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
      profile_url: me
    })

    if (write_error) {
      return { error: write_error }
    }

    return {
      value: { id: value.id, message: `stored info about profile URL ${me}` }
    }
  }

  return storeProfile
}
