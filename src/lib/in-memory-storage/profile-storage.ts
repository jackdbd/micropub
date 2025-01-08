import type { Atom } from '@thi.ng/atom'
import type { RetrieveRecord, StoreRecord } from '../crud.js'
import type { Profile } from '../indieauth/index.js'
import type { Datum, ProfileURL } from '../profile-storage-interface/index.js'

interface Config {
  atom: Atom<Record<ProfileURL, Profile>>
}

export const defStorage = (config: Config) => {
  const { atom } = config

  const retrieveRecord: RetrieveRecord<Profile, ProfileURL> = async (me) => {
    const record = atom.deref()[me]
    return { value: record }
  }

  const storeRecord: StoreRecord<Datum> = async (datum) => {
    const { me, ...rest } = datum

    atom.swap((state) => {
      return { ...state, [me]: rest }
    })
    return { value: { message: `atom swapped` } }
  }

  return { retrieveRecord, storeRecord }
}
