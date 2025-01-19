import type { TestExpression } from './test-expression.js'

export type Condition = 'AND' | 'OR'

export interface DeleteQuery {
  where?: TestExpression[]
  condition?: Condition
}

export interface SelectQuery {
  select?: string[]
  where?: TestExpression[]
  condition?: Condition
}

export interface UpdateQuery {
  returning?: string[]
  set: { [key: string]: any }
  where: TestExpression[]
  condition?: Condition
}

export interface InsertOrReplaceQuery {
  // returning: string[] // allow to define it? E.g. ['me', 'photo']
  values: { [key: string]: any }
}

export type Query = SelectQuery | UpdateQuery | InsertOrReplaceQuery
