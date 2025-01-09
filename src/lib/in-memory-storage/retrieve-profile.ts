import type { Atom } from '@thi.ng/atom'
import type Ajv from 'ajv'
import {
  defRetrieveProfile as defImplementation,
  type ProfileTable
} from '../profile-storage-interface/index.js'
import { defStorage } from './profile-storage.js'

interface Config {
  ajv?: Ajv
  atom: Atom<ProfileTable>
  report_all_ajv_errors?: boolean
}

export const defRetrieveProfile = (config: Config) => {
  const { ajv, atom, report_all_ajv_errors } = config

  const { retrieveRecord } = defStorage({ atom })

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
