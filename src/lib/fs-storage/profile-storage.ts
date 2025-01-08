import type { RetrieveRecord, StoreRecord } from '../crud.js'
import type { Profile } from '../indieauth/schemas.js'
import type {
  Datum,
  ProfileTable,
  ProfileURL
} from '../profile-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const retrieveRecord: RetrieveRecord<Profile, ProfileURL> = async (me) => {
    const { error, value: table } = await readJSON<ProfileTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[me] }
  }

  const storeRecord: StoreRecord<Datum> = async (datum) => {
    const { error: read_error, value: table } = await readJSON<ProfileTable>(
      filepath
    )

    if (read_error) {
      return { error: read_error }
    }

    const { me, ...rest } = datum

    table[me] = rest

    const { error: write_error, value } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { value }
  }

  return { retrieveRecord, storeRecord }
}
