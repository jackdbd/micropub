import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  defStoreProfile as defImplementation,
  type ProfileTable
} from '../profile-storage-interface/index.js'
import { defStorage } from './profile-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<ProfileTable>
  prefix?: string
  report_all_ajv_errors: boolean
}

export const defStoreProfile = (config: Config) => {
  const { ajv, atom, prefix, report_all_ajv_errors } = config

  const { storeRecord } = defStorage({ atom })

  return defImplementation({
    ajv,
    prefix,
    report_all_ajv_errors,
    storeRecord
  })
}
