import { applyToDefaults } from '@hapi/hoek'
import type { Schema } from 'ajv'
import stringify from 'fast-safe-stringify'
import { table, type Alignment, type TableUserConfig } from 'table'
import type { SelectQuery, UpdateQuery } from '../src/lib/storage-api/index.js'
import {
  isSelectQuery,
  isUpdateQuery
} from '../src/lib/storage-implementations/index.js'
import { EMOJI, toEmoji } from './emojis.js'
import { recordIdentifier } from './record-identifier.js'

// https://github.com/gajus/table?tab=readme-ov-file#api
export interface TableOptions {
  columnDefault?: {
    width?: number
  }
  header?: {
    alignment?: Alignment
    content: string
  }
}

const table_defaults = {
  columnDefault: {
    width: 15
  },
  header: {
    alignment: 'center' as Alignment,
    content: ''
  }
}

export const queryTable = (
  query: SelectQuery | UpdateQuery,
  table_options?: TableOptions
) => {
  const table_config = applyToDefaults(
    table_defaults,
    table_options ?? {}
  ) as Required<TableUserConfig>

  const condition = query.condition || 'AND'
  const header_lines: string[] = []
  const data: string[][] = []

  // TODO: ideally this should print something like this:
  // |        update query            |
  // ----------------------------------
  // |           | where expression 1 |
  // | condition | where expression 2 |
  // |           | set expression     |

  if (isUpdateQuery(query)) {
    header_lines.push(`Update Query`)

    data.push(['SET'])
    Object.entries(query.set).forEach(([key, value]) => {
      data.push([`${key}: ${value}`])
    })

    data.push([`WHERE`])
    query.where.forEach(({ key, op, value }) => {
      data.push([`${key} ${op} ${value}`])
    })

    data.push(['CONDITION'])
    data.push([condition])
  } else if (isSelectQuery(query)) {
    header_lines.push(`Select Query`)

    data.push(['WHERE'])
    query.where.forEach(({ key, op, value }) => {
      data.push([`${key} ${op} ${value}`])
    })

    data.push(['CONDITION'])
    data.push([condition])
  } else {
    throw new Error(`this query is not supported: ${stringify(query)}`)
  }

  const content = header_lines.join(' - ').trim()

  const tableConfig = {
    ...table_config,
    header: { ...table_config.header, content }
  }

  try {
    return table(data, tableConfig)
  } catch (ex: any) {
    return `${EMOJI.EXCEPTION} cannot render queryTable: ${ex.message}`
  }
}

export const retrievedTable = (
  retrieved: Record<string, any>,
  table_options?: TableOptions
) => {
  const table_config = applyToDefaults(
    table_defaults,
    table_options ?? {}
  ) as Required<TableUserConfig>

  const content = table_config.header.content

  const keys = Object.keys(retrieved)
  const data = [keys, Object.values(retrieved)]

  const tableConfig = {
    ...table_config,
    header: { ...table_config.header, content }
  }
  return table(data, tableConfig)
}

export enum Action {
  DELETED = 'deleted',
  RETRIEVED = 'retrieved',
  STORED = 'stored',
  UPDATED = 'updated'
}

export interface RecordTableConfig {
  record: Record<string, any>
  action?: Action
  schema?: Schema
}

export const recordTable = (
  config: RecordTableConfig,
  table_options?: TableOptions
) => {
  const { record, schema } = config

  const table_config = applyToDefaults(
    table_defaults,
    table_options ?? {}
  ) as Required<TableUserConfig>

  const { key, value } = recordIdentifier(record)
  const header_lines = [`${toEmoji(key)} record ${value}`]

  if (schema) {
    if (typeof schema !== 'boolean') {
      if (schema.$id) {
        header_lines.push(`Schema $id: ${schema.$id}`)
      }
      if (schema.title) {
        header_lines.push(`Schema title: ${schema.title}`)
      }
      //   if (schema.description) {
      //     header_lines.push(`Schema description ${schema.description}`)
      //   }
    }
  }

  const keys = Object.keys(record)
  const data = [keys, Object.values(record)]

  const subject = `${header_lines.join(' - ').trim()}`
  const subject_width = subject.length

  try {
    let content: string
    const container_width = table_config.columnDefault.width! * data[0].length
    if (subject_width > container_width) {
      content = subject.slice(0, container_width)
    } else {
      content = subject
    }

    const tableConfig = {
      ...table_config,
      header: { ...table_config.header, content }
    }
    return table(data, tableConfig)
  } catch (ex: any) {
    return `${EMOJI.EXCEPTION} cannot render recordTable: ${ex.message}`
  }
}

export const schemaTable = (schema: Schema, table_options?: TableOptions) => {
  if (typeof schema === 'boolean') {
    throw new Error('schema must be an object')
  }

  const table_config = applyToDefaults(
    table_defaults,
    table_options ?? {}
  ) as Required<TableUserConfig>

  const header_lines = [table_config.header.content]

  if (schema.$id) {
    header_lines.push(`$id: ${schema.$id}`)
  }
  if (schema.title) {
    header_lines.push(`title: ${schema.title}`)
  }
  if (schema.description) {
    header_lines.push(`description: ${schema.description}`)
  }

  const content = header_lines.join('\n')

  const tableConfig: TableUserConfig = {
    ...table_config,
    columns: [
      { alignment: 'left', width: 20 },
      { alignment: 'left', width: 80 }
    ],
    header: { ...table_config.header, content }
  }

  const data = Object.entries(schema.properties).map(([key, x]) => {
    const val = JSON.stringify(x, null, 2)
    return [key, val]
  })

  try {
    return table(data, tableConfig)
  } catch (ex: any) {
    return `${EMOJI.EXCEPTION} cannot render schemaTable: ${ex.message}`
  }
}

export interface RecordsTableConfig {
  records: Record<string, any>[]
  action?: Action
  schema?: Schema
}
