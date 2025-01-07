import type { Atom } from '@thi.ng/atom'
import type { Profile } from '../indieauth/index.js'
import type {
  Data,
  ProfileTable,
  ProfileURL,
  RetrieveRecord,
  StoreRecord
} from '../profile-storage-interface/index.js'

interface Config {
  atom: Atom<ProfileTable>
}

export const defStorage = (config: Config) => {
  const { atom } = config

  const retrieveRecord: RetrieveRecord<Profile, ProfileURL> = async (
    profile_url
  ) => {
    const record = atom.deref()[profile_url]
    return { value: record }
  }

  const storeRecord: StoreRecord<Data> = async (data) => {
    const { profile_url, ...rest } = data

    atom.swap((state) => {
      return { ...state, [profile_url]: rest }
    })
    return { value: { id: profile_url } }
  }

  return { retrieveRecord, storeRecord }
}
