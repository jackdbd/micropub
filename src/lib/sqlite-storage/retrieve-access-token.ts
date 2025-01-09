import type { Client } from '@libsql/client'
import type Ajv from 'ajv'
import type { RetrieveRecord } from '../crud.js'
import {
  defRetrieveAccessToken as defImplementation,
  type JTI,
  type StoreAccessTokenParam
} from '../token-storage-interface/index.js'

export interface Config {
  ajv?: Ajv
  client: Client
  report_all_ajv_errors?: boolean
}

export const defRetrieveAccessToken = (config: Config) => {
  const { ajv, client, report_all_ajv_errors } = config

  const retrieveRecord: RetrieveRecord<StoreAccessTokenParam, JTI> = async (
    jti
  ) => {
    try {
      const rs = await client.execute({
        sql: 'SELECT * FROM access_tokens WHERE jti = ?',
        args: [jti]
      })

      if (rs.rows.length === 1) {
        const value = rs.rows[0] as unknown as StoreAccessTokenParam
        return { value }
      } else {
        const message = `Retrieved ${rs.rows.length} records from DB`
        return { error: new Error(message) }
      }
    } catch (ex: any) {
      const message = `Cannot retrieve record about access token ${jti} from DB: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
