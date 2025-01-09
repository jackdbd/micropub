import fs from 'node:fs/promises'
import * as lockfile from 'proper-lockfile'
import type { Criteria, Value } from '../crud.js'
import type { UpdatePatch } from '../schemas/index.js'
import { toRecords } from './records.js'

const lock_options = { retries: 15 }

type ParsedJSON = { [k: string]: any }
// type ParsedJSON = { [k: string]: unknown }

export const readJSON = async <V extends ParsedJSON>(filepath: string) => {
  try {
    const json = await fs.readFile(filepath, { encoding: 'utf8' })
    return { value: JSON.parse(json) as V }
  } catch (err: any) {
    return { error: err as Error }
  }
}

export const writeJSON = async (filepath: string, data: any) => {
  let release: (() => Promise<void>) | undefined
  try {
    release = await lockfile.lock(filepath, lock_options)
    // console.log(`=== 🔒 acquired lock on ${filepath} ===`)
    await fs.writeFile(filepath, JSON.stringify(data), 'utf8')
    return { value: { message: `wrote ${filepath}` } }
  } catch (err: any) {
    return { error: err as Error }
  } finally {
    if (release) {
      // console.log(`=== 🔓 release lock on ${filepath} ===`)
      await release()
    }
  }
}

// Remember that WHERE can be composed by multiple expressions.
// SELECT *
// FROM suppliers
// WHERE
//   (state = 'California' AND supplier_id <> 900) OR
//   (supplier_id = 100);

export const updateJSON = async <V extends ParsedJSON>(
  filepath: string,
  config: { id: string; set: Criteria; where?: Criteria }
) => {
  const { id, where } = config

  const { error: read_error, value: m_before } = await readJSON<V>(filepath)

  if (read_error) {
    return { error: read_error }
  }

  const patches: { id: string; patch: UpdatePatch }[] = []
  const records: Record<string, Value>[] = []
  for (const [id_val, data] of Object.entries(m_before)) {
    let record_match = false
    // maybe define a function entryToRecord
    const record: Record<string, Value> = { [id]: id_val, ...data }

    for (const [key, after] of Object.entries(config.set)) {
      if (where) {
        const match = Object.keys(where).reduce((acc, cv) => {
          return { ...acc, [cv]: false }
        }, {} as Record<string, boolean>)

        // This is an AND match. I would need to construct an "inner" match object
        for (const [k, given] of Object.entries(where)) {
          match[k] = record[k] === given
        }

        // OR match
        // record_match = Object.values(match).some((v) => v === true)
        // AND match
        record_match = Object.values(match).every((v) => v === true)
      } else {
        record_match = true
      }

      if (record_match) {
        const before = record[key]
        patches.push({ id, patch: { replace: { key, before, after } } })
        record[key] = after as Value
      }
    }

    records.push(record)
  }

  const m_after = records.reduce((acc, record) => {
    const { [id]: id_val, ...rest } = record
    return { ...acc, [id_val as any]: rest }
  }, {})

  const { error: write_error } = await writeJSON(filepath, m_after)

  if (write_error) {
    return { error: write_error }
  }

  const message = `${patches.length} update patches in ${filepath}`
  return { value: { message, patches } }
}

export const oldUpdateJSON = async <V extends ParsedJSON>(
  filepath: string,
  criteria: Criteria
) => {
  const { error: read_error, value: table } = await readJSON<V>(filepath)

  if (read_error) {
    return { error: read_error }
  }

  const patches: UpdatePatch[] = []
  for (const record of Object.values(table)) {
    if (criteria) {
      for (const [key, after] of Object.entries(criteria)) {
        let before: Value = (record as any)[key]
        if (after !== before) {
          patches.push({ replace: { key, before, after } })
          // mutate the hash map in place
          ;(record as Record<string, Value>)[key] = after
        }
      }
    }
  }

  const { error: write_error } = await writeJSON(filepath, table)

  if (write_error) {
    return { error: write_error }
  }

  const message = `${patches.length} update patches in ${filepath}`
  return { value: { message, patches } }
}

export const filterJSON = async <V extends ParsedJSON>(
  filepath: string,
  keys: string[],
  criteria?: Criteria
) => {
  const { error, value: data } = await readJSON<V>(filepath)

  if (error) {
    return { error }
  }

  let records = toRecords({ data, keys })

  if (criteria) {
    for (const [k, expected] of Object.entries(criteria)) {
      records = records.filter((record) => {
        const actual: Value = (record as any)[k]
        return actual === expected
      })
    }
  }

  return { value: records as V[] }
}
