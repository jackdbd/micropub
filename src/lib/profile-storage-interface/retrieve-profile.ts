import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  me_after_url_canonicalization,
  type Profile
} from '../indieauth/index.js'
import { canonicalUrl } from '../url-canonicalization.js'
import { conformResult } from '../validators.js'
import { RetrieveProfile, type RetrieveRecord } from './schemas.js'

export interface Config {
  ajv?: Ajv
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors: boolean
  retrieveRecord: RetrieveRecord<Profile>
}

export const defRetrieveProfile = (config: Config) => {
  const { report_all_ajv_errors, retrieveRecord } = config

  // const log = config.log || (() => {})
  const prefix = config.prefix ?? 'retrieve-profile '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
      'email',
      'uri'
    ])
  }

  const retrieveProfile: RetrieveProfile = async (profile_url) => {
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

    const { error: retrieve_error, value: record } = await retrieveRecord(me)

    if (retrieve_error) {
      return { error: retrieve_error }
    }

    if (!record) {
      return {
        error: new Error(`profile URL ${me} not found in storage`)
      }
    }

    return { value: record }
  }

  return retrieveProfile
}
