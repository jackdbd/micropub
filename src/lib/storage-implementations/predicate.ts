import type { BaseRecord } from '../storage-api/index.js'
import type {
  Operation,
  TestExpression
} from '../storage-api/test-expression.js'

interface Config {
  op: Operation
  actual: any
  given: any
}

export const logTest = ({ op, actual, given }: Config) => {
  console.log({
    actual,
    given,
    test: `actual ${op} given`,
    result: eval(`actual ${op} given`)
  })
}

export const unsupportedOperation = ({ op, actual, given }: Config) => {
  return new Error(`${actual} (actual) ${op} ${given} (given) is not supported`)
}

export const isNumeric = (x: any) => {
  return typeof x === 'number' || typeof x === 'bigint'
}

export type Predicate<R extends BaseRecord = BaseRecord> = (
  record: R
) => boolean

export const defPredicate = <R extends BaseRecord = BaseRecord>(
  test_expression: TestExpression
) => {
  const { key, op, value: given } = test_expression

  return function predicate(record: R) {
    const actual = record[key]

    // logTest({ op, actual, given })

    switch (op) {
      case '==': {
        return actual === given
      }
      case '!=': {
        return actual !== given
      }
      case '<': {
        if (isNumeric(actual) && isNumeric(given)) {
          return actual < given
        } else {
          throw unsupportedOperation({ op, actual, given })
        }
      }
      case '<=': {
        if (isNumeric(actual) && isNumeric(given)) {
          return actual <= given
        } else {
          throw unsupportedOperation({ op, actual, given })
        }
      }
      case '>': {
        if (isNumeric(actual) && isNumeric(given)) {
          return actual > given
        } else {
          throw unsupportedOperation({ op, actual, given })
        }
      }
      case '>=': {
        if (isNumeric(actual) && isNumeric(given)) {
          return actual >= given
        } else {
          throw unsupportedOperation({ op, actual, given })
        }
      }
      default: {
        throw new Error(`operation '${op}' not implemented`)
      }
    }
  }
}

export const composeAnd = <R extends BaseRecord = BaseRecord>(
  predicates: Predicate<R>[]
): Predicate<R> => {
  return (record: R) => predicates.every((predicate) => predicate(record))
}

export const composeOr = <R extends BaseRecord = BaseRecord>(
  predicates: Predicate<R>[]
): Predicate<R> => {
  return (record: R) => predicates.some((predicate) => predicate(record))
}
