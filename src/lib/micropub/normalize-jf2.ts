import assert from 'node:assert'
import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'

// type Value = number | string | Photo | number[] | string[] | Photo[]
type Value = number | string | any[]
type Entry = [string, Value]
type Acc = Record<string, Value>

export const normalizeJf2 = (input: Jf2): Jf2 => {
  const tmp = Object.entries(input).reduce((acc, entry) => {
    const [key, value] = entry as Entry

    if (key.includes('[]')) {
      // console.log('=== entry ===', entry)
      const k = key.split('[]').at(0)!

      if (acc[k]) {
        assert.ok(Array.isArray(acc[k]))
        // console.log(`update ${k} array`)
        if (Array.isArray(value)) {
          acc[k].push(...value)
        } else {
          acc[k].push(value)
        }
      } else {
        if (Array.isArray(value)) {
          // console.log(`set ${k}=${JSON.stringify(value)}`)
          acc[k] = value
        } else {
          // console.log(`set ${k} array`)
          acc[k] = [value]
        }
      }

      return acc
    } else {
      return { ...acc, [key]: value }
    }
  }, {} as Acc)

  const output = Object.entries(tmp).reduce((acc, entry) => {
    const [key, value] = entry as Entry

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return acc
      } else if (value.length === 1) {
        return { ...acc, [key]: value[0] }
      } else {
        return { ...acc, [key]: value }
      }
    } else {
      return { ...acc, [key]: value }
    }
  }, {} as Acc)

  return output satisfies Jf2
}
