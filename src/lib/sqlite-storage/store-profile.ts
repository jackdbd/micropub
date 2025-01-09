import type { Client } from '@libsql/client'
import type Ajv from 'ajv'
import type { StoreRecord } from '../crud.js'
import {
  defStoreProfile as defImplementation,
  type ProfileURL,
  type StoreProfileParam
} from '../profile-storage-interface/index.js'

const DEFAULT = { email: null }

export interface Config {
  ajv?: Ajv
  client: Client
  report_all_ajv_errors?: boolean
}

export const defStoreProfile = (config: Config) => {
  const { ajv, client, report_all_ajv_errors } = config

  const storeRecord: StoreRecord<StoreProfileParam> = async (param) => {
    const { email } = param

    const sql = `
    INSERT INTO profiles VALUES 
      (:me, :name, :photo, :url, :email) 
    RETURNING me`

    try {
      const rs = await client.execute({
        sql,
        args: { ...param, email: email || DEFAULT.email }
      })

      const rowid = rs.lastInsertRowid

      if (rs.rows.length === 1) {
        const row = rs.rows[0] as unknown as { me: ProfileURL }
        const message = `stored info about profile URL ${row.me} in DB`
        return { value: { me: row.me, message, rowid } }
      }

      const message = `Inserted ${rs.rows.length} records in DB`
      return { error: new Error(message) }
    } catch (ex: any) {
      const message = `Cannot store record about profile URL ${param.me} in DB: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
