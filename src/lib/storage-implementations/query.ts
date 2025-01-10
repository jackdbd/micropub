import type {
  Query,
  InsertOrReplaceQuery,
  UpdateQuery,
  SelectQuery
} from '../storage-api/query.js'

export const isInsertOrReplaceQuery = (
  query: Query
): query is InsertOrReplaceQuery => {
  return 'values' in query
}

export const isUpdateQuery = (query: Query): query is UpdateQuery => {
  return 'set' in query
}

export const isSelectQuery = (query: Query): query is SelectQuery => {
  return !isUpdateQuery(query) && !isInsertOrReplaceQuery(query)
}
