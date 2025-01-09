import type { Client } from '@libsql/client'
import type Ajv from 'ajv'
import type { StoreRecord } from '../crud.js'
import {
  defStoreRefreshToken as defImplementation,
  type RefreshToken,
  type StoreRefreshTokenParam
} from '../token-storage-interface/index.js'

const DEFAULT = { revoked: false, revocation_reason: null }

export interface Config {
  ajv?: Ajv
  client: Client
  report_all_ajv_errors?: boolean
}

export const defStoreRefreshToken = (config: Config) => {
  const { ajv, client, report_all_ajv_errors } = config

  const storeRecord: StoreRecord<StoreRefreshTokenParam> = async (param) => {
    const { refresh_token, revoked, revocation_reason } = param

    // It seems the query requires the primary key to be passed in the first
    // position, and then all other fields in the alphabetical order.
    // This is definetely strange... A bug in libsql-client-ts?
    // https://github.com/tursodatabase/libsql-client-ts/issues
    const sql = `INSERT INTO refresh_tokens VALUES 
      (:refresh_token,
       :client_id,
       :exp,
       :iss,
       :jti,
       :me,
       :redirect_uri,
       :revoked,
       :revocation_reason,
       :scope)
    RETURNING refresh_token`

    const args = {
      ...param,
      revoked: revoked || DEFAULT.revoked,
      revocation_reason: revocation_reason || DEFAULT.revocation_reason
    }

    try {
      const rs = await client.execute({ sql, args })

      const rowid = rs.lastInsertRowid

      if (rs.rows.length === 1) {
        // const refresh_token = rs.rows[0]['refresh_token']
        const row = rs.rows[0] as unknown as { refresh_token: RefreshToken }
        const message = `stored record about refresh token ${row.refresh_token} in DB`
        return { value: { refresh_token: row.refresh_token, message, rowid } }
      }

      const message = `Inserted ${rs.rows.length} records in DB`
      return { error: new Error(message) }
    } catch (ex: any) {
      const message = `Cannot store record about refresh token ${refresh_token} in DB: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
