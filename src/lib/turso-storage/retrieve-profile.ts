import type { Client } from '@libsql/client'
import type Ajv from 'ajv'
import type { RetrieveRecord } from '../crud.js'
import {
  defRetrieveProfile as defImplementation,
  type ProfileURL,
  type StoreProfileParam
} from '../profile-storage-interface/index.js'

export interface Config {
  ajv?: Ajv
  client: Client
  report_all_ajv_errors?: boolean
}

export const defRetrieveProfile = (config: Config) => {
  const { ajv, client, report_all_ajv_errors } = config

  const retrieveRecord: RetrieveRecord<StoreProfileParam, ProfileURL> = async (
    me
  ) => {
    // decide whether to store 'me' or 'profile_url' in the DB. In any case,
    // it's the canonicalized URL.
    try {
      const rs = await client.execute({
        sql: 'SELECT * FROM profiles WHERE me = ?',
        args: [me]
      })

      if (rs.rows.length === 1) {
        const row = rs.rows[0]
        const value = row as unknown as StoreProfileParam
        return { value }
      } else {
        const message = `Retrieved ${rs.rows.length} records from DB`
        return { error: new Error(message) }
      }
    } catch (ex: any) {
      const message = `Cannot retrieve record about profile URL ${me} from DB: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
