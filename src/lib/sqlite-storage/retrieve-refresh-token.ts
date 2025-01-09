import type { Client } from '@libsql/client'
import type Ajv from 'ajv'
import type { RetrieveRecord } from '../crud.js'
import {
  defRetrieveRefreshToken as defImplementation,
  type RefreshToken,
  type StoreRefreshTokenParam
} from '../token-storage-interface/index.js'

export interface Config {
  ajv?: Ajv
  client: Client
  report_all_ajv_errors?: boolean
}

export const defRetrieveRefreshToken = (config: Config) => {
  const { ajv, client, report_all_ajv_errors } = config

  const retrieveRecord: RetrieveRecord<
    StoreRefreshTokenParam,
    RefreshToken
  > = async (refresh_token) => {
    try {
      const rs = await client.execute({
        sql: 'SELECT * FROM refresh_tokens WHERE refresh_token = :refresh_token',
        args: { refresh_token }
      })

      if (rs.rows.length === 1) {
        const value = rs.rows[0] as unknown as StoreRefreshTokenParam
        return { value }
      } else {
        const message = `Retrieved ${rs.rows.length} records from DB`
        return { error: new Error(message) }
      }
    } catch (ex: any) {
      const message = `Cannot retrieve refresh token ${refresh_token} from DB: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
