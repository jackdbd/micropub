import type { Schema } from 'ajv'
import c from 'ansi-colors'
import type { SelectQuery, UpdateQuery } from '../src/lib/storage-api/index.js'
import { toEmoji } from './emojis.js'
import { recordIdentifier } from './record-identifier.js'
import {
  queryTable,
  recordTable,
  schemaTable,
  type RecordTableConfig,
  type RecordsTableConfig
} from './tables.js'

export const logRecord = (config: RecordTableConfig) => {
  const { action, record } = config
  if (action) {
    const { key, value } = recordIdentifier(record)
    console.log(c.green(`${action} record ${value} (${key})`))
  }
  console.log(recordTable(config))
}

export const logRecords = (config: RecordsTableConfig) => {
  const { action, records } = config
  if (action) {
    const summary = `${action} ${records.length} records`
    console.log(`${toEmoji(action)} ${c.green(`${summary}`)}`)
  }
  const identifiers = records.map((rec) => {
    const { key, value } = recordIdentifier(rec)
    return `${value} (${key})`
  })
  console.log(identifiers)
}

export const logQuery = (query: SelectQuery | UpdateQuery) => {
  console.log(queryTable(query, { columnDefault: { width: 80 } }))
}

export const logSchema = (schema: Schema) => {
  console.log(schemaTable(schema, { columnDefault: { width: 80 } }))
}
