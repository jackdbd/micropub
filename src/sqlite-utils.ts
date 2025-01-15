import { createClient, type Transaction } from '@libsql/client'
import { insertQuery } from './lib/sqlite-storage/queries.js'
import type { BaseProps } from './lib/storage-api'
import { Environment, SQLITE_DATABASE } from './constants.js'

export interface Config {
  env: Environment
}

export interface BatchConfig {
  inserts: { table: string; props: BaseProps }[]
}

export type BatchTransaction = (cfg: BatchConfig) => Promise<
  | { error: Error; value?: undefined }
  | {
      error?: undefined
      value: { message: string; result_sets: any[] }
    }
>

export const defSQLiteUtils = (config: Config) => {
  const { env } = config

  const client = createClient(SQLITE_DATABASE[env])

  const batchTransaction: BatchTransaction = async (cfg) => {
    const { inserts } = cfg

    const tables = [...new Set(inserts.map(({ table }) => table))]

    let transaction: Transaction
    try {
      transaction = await client.transaction('write')
    } catch (ex: any) {
      return { error: new Error(`cannot start transaction: ${ex.message}`) }
    }

    const stmts = inserts.map(({ table, props }) => {
      return insertQuery(table, props)
    })

    try {
      const result_sets = await transaction.batch(stmts)

      // const promises = inserts.map(({ table, props }) => {
      //   return transaction.execute(insertQuery(table, jsPropsToSQLite(props)))
      // })
      // const result_sets = await Promise.all(promises)

      await transaction.commit()

      const message = `committed a transaction of ${
        inserts.length
      } insert statements on ${tables.length} tables (${tables.join(', ')})`
      return { value: { message, result_sets } }
    } catch (ex: any) {
      await transaction.rollback()
      return {
        error: new Error(`the transaction was rolled back: ${ex.message}`)
      }
    }
  }

  return { batchTransaction }
}
