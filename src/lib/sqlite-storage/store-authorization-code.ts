import type { Client } from '@libsql/client'
import type Ajv from 'ajv'
import type { StoreRecord } from '../crud.js'
import {
  type Code,
  defStoreAuthorizationCode as defImplementation,
  type StoreAuthorizationCodeParam
} from '../authorization-code-storage-interface/index.js'

const DEFAULT = { used: false }

export interface Config {
  ajv?: Ajv
  client: Client
  report_all_ajv_errors?: boolean
}

export const defStoreAuthorizationCode = (config: Config) => {
  const { ajv, client, report_all_ajv_errors } = config

  const storeRecord: StoreRecord<StoreAuthorizationCodeParam> = async (
    param
  ) => {
    const { used } = param

    const sql = `
    INSERT INTO authorization_codes VALUES 
      (:code,
       :client_id,
       :code_challenge,
       :code_challenge_method,
       :exp,
       :iss,
       :me,
       :redirect_uri,
       :scope,
       :used) 
    RETURNING code`

    const args = { ...param, used: used || DEFAULT.used }

    try {
      const rs = await client.execute({ sql, args })

      const rowid = rs.lastInsertRowid

      if (rs.rows.length === 1) {
        const row = rs.rows[0] as unknown as { code: Code }
        const message = `stored record about authorization code ${row.code} in DB`
        return { value: { code: row.code, message, rowid } }
      }

      const message = `Inserted ${rs.rows.length} records in DB`
      return { error: new Error(message) }
    } catch (ex: any) {
      const message = `Cannot store record about authorization code ${param.code} in DB: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
