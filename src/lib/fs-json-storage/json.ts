import fs from 'node:fs/promises'
import stringify from 'fast-safe-stringify'
import * as lockfile from 'proper-lockfile'
import type { BaseRecord } from '../storage-api/index.js'

// https://www.w3schools.com/js/js_json_datatypes.asp
export type JSONValue = string | number | object | boolean | null | JSONValue[]

const lock_options = { retries: 15 }

export type JSONRecord = Record<string, JSONValue> & BaseRecord

export type ParsedJSON = Record<string, JSONRecord>

export const init = async (filepath: string) => {
  let exists = false
  let logs: string[] = []

  try {
    await fs.access(filepath)
    exists = true
    logs.push(`file ${filepath} exists`)
  } catch {
    logs.push(`file ${filepath} does not exist, creating it now`)
  }

  if (!exists) {
    try {
      await fs.writeFile(filepath, stringify({}), 'utf8')
      logs.push(`file ${filepath} created`)
    } catch (ex: any) {
      return { error: ex as Error }
    }
  }

  return { value: { logs } }
}

export const reset = async (filepath: string) => {
  const prefix = '[json-reset] '
  let logs: string[] = []

  try {
    await fs.writeFile(filepath, stringify({}), 'utf8')
    logs.push(`${prefix}file ${filepath} created/resetted`)
  } catch (ex: any) {
    return { error: new Error(`${prefix}${ex.message}`) }
  }

  return { value: { logs } }
}

export const parse = async <V extends ParsedJSON = ParsedJSON>(
  filepath: string
) => {
  const prefix = '[json-parse] '
  try {
    const json = await fs.readFile(filepath, { encoding: 'utf8' })
    return { value: JSON.parse(json) as V }
  } catch (ex: any) {
    return { error: new Error(`${prefix}${ex.message}`) }
  }
}

export const write = async <D extends ParsedJSON = ParsedJSON>(
  filepath: string,
  data: D
) => {
  const prefix = '[json-write] '
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
    await fs.writeFile(filepath, stringify(data), 'utf8')
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
