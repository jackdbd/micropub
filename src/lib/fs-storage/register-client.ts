import type Ajv from 'ajv'
import {
  defRegisterClient as defImplementation,
  type ClientTable,
  type GetRecord,
  type SetRecord
} from '../clients-storage-interface/index.js'
import { readJSON, writeJSON } from './json.js'

interface Config {
  ajv?: Ajv
  filepath: string
  prefix?: string
  report_all_ajv_errors?: boolean
}

export const defRegisterClient = (config: Config) => {
  const { ajv, filepath, prefix, report_all_ajv_errors } = config

  const getRecord: GetRecord = async (client_id) => {
    const { error, value: table } = await readJSON<ClientTable>(filepath)

    if (error) {
      return { error }
    }

    return { value: table[client_id] }
  }

  const setRecord: SetRecord = async (client_id, record) => {
    const { error, value: table } = await readJSON<ClientTable>(filepath)

    if (error) {
      return { error }
    }

    table[client_id] = record

    const { error: write_error } = await writeJSON(filepath, table)

    if (write_error) {
      return { error: write_error }
    }

    return { error: undefined }
  }

  return defImplementation({
    ajv,
    getRecord,
    prefix,
    report_all_ajv_errors,
    setRecord
  })
}
