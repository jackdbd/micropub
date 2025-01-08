import type { Client } from '@libsql/client'
import type Ajv from 'ajv'
import type { RetrieveRecord } from '../crud.js'
import {
  defRetrieveAuthorizationCode as defImplementation,
  type Code,
  type StoreAuthorizationCodeParam
} from '../authorization-code-storage-interface/index.js'

export interface Config {
  ajv?: Ajv
  client: Client
  report_all_ajv_errors?: boolean
}

export const defRetrieveAuthorizationCode = (config: Config) => {
  const { ajv, client, report_all_ajv_errors } = config

  const retrieveRecord: RetrieveRecord<
    StoreAuthorizationCodeParam,
    Code
  > = async (code) => {
    try {
      const rs = await client.execute({
        sql: 'SELECT * FROM authorization_codes WHERE code = ?',
        args: [code]
      })

      if (rs.rows.length === 1) {
        const value = rs.rows[0] as unknown as StoreAuthorizationCodeParam
        return { value }
      } else {
        const message = `Retrieved ${rs.rows.length} records from DB`
        return { error: new Error(message) }
      }
    } catch (ex: any) {
      const message = `Cannot retrieve record about authorization code ${code} from DB: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({ ajv, report_all_ajv_errors, retrieveRecord })
}
