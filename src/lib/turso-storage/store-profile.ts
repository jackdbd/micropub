import { createClient } from '@libsql/client'
import type Ajv from 'ajv'
import type { StoreRecord } from '../crud.js'
import {
  defStoreProfile as defImplementation,
  type Datum,
  type StoreProfile
} from '../profile-storage-interface/index.js'

export interface Config {
  ajv?: Ajv
  database_token: string
  database_url: string
  report_all_ajv_errors: boolean
}

export const defStoreProfile = (config: Config): StoreProfile => {
  const { ajv, database_token, database_url, report_all_ajv_errors } = config

  const turso = createClient({ url: database_url, authToken: database_token })

  const storeRecord: StoreRecord<Datum> = async (datum) => {
    const { me, name, photo, url, email } = datum
    try {
      const rs = await turso.execute({
        sql: 'INSERT INTO profiles VALUES (:me, :name, :photo, :url, :email) RETURNING me',
        args: { me, name, photo, url, email: email || null }
      })

      const rowid = rs.lastInsertRowid

      if (rs.rows.length === 1) {
        const row = rs.rows[0] as unknown as { me: string }
        const message = `stored info about profile URL ${me} in ${database_url}`
        return { value: { me: row.me, message, rowid } }
      }

      const message = `Inserted ${rs.rows.length} records in ${database_url}`
      return { error: new Error(message) }
    } catch (ex: any) {
      const message = `Cannot store info about profile URL ${me} in ${database_url}: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
