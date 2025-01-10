export type JSValue =
  | string
  | number
  | boolean
  | object
  | null
  | undefined
  | symbol
  | bigint

/**
 * Instrinsic properties of an item, not tied to any storage backend.
 */
export type BaseProps = Record<string, JSValue>

/**
 * This represents the combination of some properties of a record stored in a
 * storage backend (e.g. the subset of returned by a SELECT query, or the subset
 * returned by an INSERT/UPDATE/DELETE/REPLACE query that include a RETURNING
 * clause.
 */
export type BaseRecord = Record<string, JSValue>
