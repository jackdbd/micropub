import type { Client } from '@libsql/client'
import type Ajv from 'ajv'
import type { StoreRecord } from '../crud.js'
import {
  defStoreAccessToken as defImplementation,
  type JTI,
  type StoreAccessTokenParam
} from '../token-storage-interface/index.js'

const DEFAULT = { revoked: false, revocation_reason: null }

export interface Config {
  ajv?: Ajv
  client: Client
  report_all_ajv_errors?: boolean
}

export const defStoreAccessToken = (config: Config) => {
  const { ajv, client, report_all_ajv_errors } = config

  const storeRecord: StoreRecord<StoreAccessTokenParam> = async (param) => {
    const { revoked, revocation_reason } = param

    const sql = `
    INSERT INTO access_tokens VALUES 
      (:jti, :client_id, :redirect_uri, :revoked, :revocation_reason) 
    RETURNING jti`

    try {
      const rs = await client.execute({
        sql,
        args: {
          ...param,
          revoked: revoked || DEFAULT.revoked,
          revocation_reason: revocation_reason || DEFAULT.revocation_reason
        }
      })

      const rowid = rs.lastInsertRowid

      if (rs.rows.length === 1) {
        // const jti = rs.rows[0]['jti']
        const row = rs.rows[0] as unknown as { jti: JTI }
        const message = `stored record about access token ${row.jti} in DB`
        return { value: { jti: row.jti, message, rowid } }
      }

      const message = `Inserted ${rs.rows.length} records in DB`
      return { error: new Error(message) }
    } catch (ex: any) {
      const message = `Cannot store record about access token ${param.jti} in DB: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({ ajv, report_all_ajv_errors, storeRecord })
}
