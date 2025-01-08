import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import type { Profile } from '../indieauth/index.js'
import {
  defStoreProfile as defImplementation,
  type ProfileURL,
  type StoreProfile
} from '../profile-storage-interface/index.js'
import { defStorage } from './profile-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<Record<ProfileURL, Profile>>
  report_all_ajv_errors: boolean
}

export const defStoreProfile = (config: Config): StoreProfile => {
  const { ajv, atom, report_all_ajv_errors } = config

  const { storeRecord } = defStorage({ atom })

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
