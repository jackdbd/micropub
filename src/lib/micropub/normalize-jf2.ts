import { Jf2 } from '@paulrobertlloyd/mf2tojf2'

export const normalizeJf2 = (input: Jf2) => {
  const output: Jf2 = Object.entries(input).reduce((acc: any, [key, value]) => {
    if (key.includes('[]')) {
      const k = key.split('[]').at(0)!
      if (acc[k]) {
        acc[k].push(value)
      } else {
        acc[k] = [value]
      }
      return acc
    } else {
      return { ...acc, [key]: value }
    }
  }, {})

  return output
}
