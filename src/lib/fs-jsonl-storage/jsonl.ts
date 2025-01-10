import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import readline from 'node:readline'
import stringify from 'fast-safe-stringify'
import * as lockfile from 'proper-lockfile'
import type { BaseRecord } from '../storage-api/index.js'

// https://www.w3schools.com/js/js_json_datatypes.asp
export type JSONValue = string | number | object | boolean | null | JSONValue[]

// // https://jsonlines.org/
export type JSONLRecord = Record<string, JSONValue> & BaseRecord

const lock_options = { retries: 15 }

export const init = async (filepath: string) => {
  const prefix = '[jsonl-init] '
  let exists = false
  let logs: string[] = []

  try {
    await fs.access(filepath)
    exists = true
    logs.push(`${prefix}file ${filepath} exists`)
  } catch {
    logs.push(`${prefix}file ${filepath} does not exist, creating it now`)
  }

  if (!exists) {
    try {
      await fs.writeFile(filepath, '', 'utf8')
      logs.push(`${prefix}file ${filepath} created`)
    } catch (ex: any) {
      return { error: ex as Error }
    }
  }

  return { value: { logs } }
}

export const reset = async (filepath: string) => {
  const prefix = '[jsonl-reset] '
  let logs: string[] = []

  try {
    await fs.writeFile(filepath, '', 'utf8')
    logs.push(`${prefix}file ${filepath} created/resetted`)
  } catch (ex: any) {
    return { error: new Error(`${prefix}${ex.message}`) }
  }

  return { value: { logs } }
}

export const parse = async <R extends JSONLRecord = JSONLRecord>(
  filepath: string
) => {
  const prefix = '[jsonl-parse] '
  const input = createReadStream(filepath)
  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity // Recognize all instances of CRLF (\r\n) as a single newline
  })

  const records: R[] = []
  for await (const line of rl) {
    try {
      records.push(JSON.parse(line))
    } catch (ex: any) {
      return { error: new Error(`${prefix}${ex.message}`) }
    }
  }

  return { value: records }
}

export const recordsToContent = <R extends JSONLRecord = JSONLRecord>(
  records: R[]
) => {
  if (records.length > 0) {
    return records.map((rec) => stringify(rec)).join('\n') + '\n'
  } else {
    return ''
  }
}

export const write = async <R extends JSONLRecord = JSONLRecord>(
  filepath: string,
  records: R[]
) => {
  const prefix = '[jsonl-write] '
  let logs: string[] = []
  const { error: init_error } = await init(filepath)

  if (init_error) {
    return { error: init_error }
  }

  let release: (() => Promise<void>) | undefined
  try {
    logs.push(`${prefix}attempting to acquire lock on ${filepath}`)
    release = await lockfile.lock(filepath, lock_options)
    logs.push(`${prefix}acquired lock on ${filepath}, writing file now`)
    await fs.writeFile(filepath, recordsToContent(records), 'utf8')
    logs.push(`${prefix}wrote file ${filepath}`)
    return { value: { logs } }
  } catch (ex: any) {
    return { error: new Error(`${prefix}${ex.message}`) }
  } finally {
    if (release) {
      logs.push(`${prefix}releasing lock on ${filepath}`)
      await release()
      logs.push(`${prefix}released lock on ${filepath}`)
    }
  }
}

export const appendMany = async <R extends JSONLRecord = JSONLRecord>(
  filepath: string,
  records: R[]
) => {
  const prefix = '[jsonl-appendMany] '
  // let logs: string[] = []
  if (records.length === 0) {
    // logs.push(`${log_prefix}no records to update in ${filepath}`)
    return { value: records }
  }

  let release: (() => Promise<void>) | undefined
  try {
    // logs.push(`${log_prefix}attempting to acquire lock on ${filepath}`)
    release = await lockfile.lock(filepath, lock_options)
    // logs.push(`${log_prefix}acquired lock on ${filepath}, updating file now`)

    if (records.length > 0) {
      await fs.appendFile(filepath, recordsToContent(records), 'utf8')
    }
    // logs.push(`${log_prefix}appended ${records.length} records to ${filepath}`)
    return { value: records }
  } catch (ex: any) {
    return { error: new Error(`${prefix}${ex.message}`) }
  } finally {
    if (release) {
      // logs.push(`${log_prefix}releasing lock on ${filepath}`)
      await release()
      // logs.push(`${log_prefix}released lock on ${filepath}`)
    }
  }
}

export type Criteria = Record<string, JSONValue>

export const filter = <R extends JSONLRecord = JSONLRecord>(
  criteria: Criteria,
  records: R[]
) => {
  let filtered = records

  for (const [k, expected] of Object.entries(criteria)) {
    filtered = filtered.filter((record) => {
      const actual = record[k]
      return actual === expected
    })
  }

  return filtered
}
