import type { Value } from '../crud.js'

export interface Config<R extends Record<string, Value>> {
  data: { [key: string]: R }
  keys: string[]
}

export const toRecords = <R extends Record<string, Value>>(
  config: Config<R>
) => {
  const { data, keys } = config

  const records = Object.entries(data).reduce((acc, cv) => {
    const [id, m] = cv

    const record = keys.reduce((acc, k, i) => {
      let val: Value
      if (i === 0) {
        val = id
      } else {
        val = m[k]
      }
      // console.log(`🔎 ${k}: ${val}`)
      return { ...acc, [k]: val }
    }, {} as R)

    return [...acc, record]
  }, [] as R[])

  return records
}
