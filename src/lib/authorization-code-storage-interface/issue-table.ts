/**
 * The authorization code that we issue to the client.
 */
type Code = string

// TODO: save also the client_id in the issue table?

export interface IssueRecord {
  exp: number
  used?: boolean
}

/**
 * Data structure that contains all authorization codes that are not yet expired.
 * Expired authorization codes should be removed from this table periodically.
 */
export type IssueTable = Record<Code, IssueRecord>
