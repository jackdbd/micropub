import { createClient } from '@libsql/client'
import type Ajv from 'ajv'
import type { RetrieveRecord } from '../crud.js'
import type { Profile } from '../indieauth/schemas.js'
import { defRetrieveProfile as defImplementation } from '../profile-storage-interface/index.js'

export interface RetrieveValue extends Profile {
  me: string
}

export interface Config {
  ajv?: Ajv
  database_token: string
  database_url: string
  report_all_ajv_errors: boolean
}

export const defRetrieveProfile = (config: Config) => {
  const { ajv, database_token, database_url, report_all_ajv_errors } = config

  const turso = createClient({ url: database_url, authToken: database_token })

  const retrieveRecord: RetrieveRecord<RetrieveValue, string> = async (me) => {
    // decide whether to store 'me' or 'profile_url' in the DB. In any case,
    // it's the canonicalized URL.
    try {
      const rs = await turso.execute({
        sql: 'SELECT * FROM profiles WHERE me = ?',
        args: [me]
      })

      if (rs.rows.length === 1) {
        const row = rs.rows[0]
        const profile = row as unknown as Profile
        // const message = `Retrieved ${profile_url} from ${database_url}`
        return {
          // value: { profile_url: me, ...profile }
          value: { me, ...profile }
        }
      } else {
        const message = `Retrieved ${rs.rows.length} records from ${database_url}`
        return { error: new Error(message) }
      }
    } catch (ex: any) {
      const message = `Cannot retrieve ${me} from ${database_url}: ${ex.message}`
      return { error: new Error(message) }
    }
  }

  return defImplementation({
    ajv,
    // prefix,
    report_all_ajv_errors,
    retrieveRecord
  })
}
