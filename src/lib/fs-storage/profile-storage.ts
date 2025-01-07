import type { Profile } from '../indieauth/schemas.js'
import type {
  Data,
  ProfileTable,
  ProfileURL,
  RetrieveRecord,
  StoreRecord
} from '../profile-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  filepath: string
}

export const defStorage = (config: Config) => {
  const { filepath } = config

  const retrieveRecord: RetrieveRecord<Profile, ProfileURL> = async (
    profile_url
  ) => {
    const { error, value: table } = await readJSON<ProfileTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[profile_url] }
  }

  const storeRecord: StoreRecord<Data> = async (data) => {
    const { error: read_error, value: table } = await readJSON<ProfileTable>(
      filepath
    )

    if (read_error) {
      return { error: read_error }
    }

    const { profile_url, ...rest } = data

    table[profile_url] = rest

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { id: profile_url } }
  }

  return { retrieveRecord, storeRecord }
}
