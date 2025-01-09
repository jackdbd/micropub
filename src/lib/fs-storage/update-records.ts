import type { Criteria } from '../crud.js'
import { updateJSON } from './json.js'

interface Config {
  filepath: string // move to factory function config
  id: string // move to factory function config
  set: Criteria
  where?: Criteria
}

export const updateRecords = async (config: Config) => {
  const { filepath, id, where } = config

  const result = await updateJSON(filepath, {
    id,
    set: config.set,
    where
  })

  return result
}
