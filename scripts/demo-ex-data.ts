import { Type } from '@sinclair/typebox'
import { defEx } from '../src/ex.js'
// import { exData, exInfo, exMessage } from '../src/ex.js'

enum Reason {
  UNKNOWN = 'unknown',
  NO_MEMORY = 'no-memory',
  NOT_FOUND = 'not-found',
  INVALID = 'invalid'
}

const schema = Type.Object({
  reason: Type.Enum(Reason),
  suggestions: Type.Array(Type.String({ minLength: 1 }), { minItems: 2 })
})

const run = () => {
  const { exData, exInfo, exMessage } = defEx({ schema })

  try {
    throw exInfo('hello', {
      reason: Reason.NO_MEMORY,
      is_bad: true,
      suggestions: ['do this', 'do that']
    })
  } catch (ex: any) {
    console.log(`ex.message: ${exMessage(ex)}`)
    console.log(`ex.data:`, exData(ex))
  }

  try {
    throw new Error('goodbye')
    // throw 'broken'
    // throw undefined
    // throw null
  } catch (ex: any) {
    console.log(`ex.message:`, exMessage(ex))
    console.log(`ex.data:`, exData(ex))
  }
}

run()
