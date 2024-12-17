/**
 * JWT ID. A unique identifier for a JWT token.
 */
type JTI = string

export interface IssueRecord {
  exp: number
  iat: number
  revoked?: boolean
  revocation_reason?: string
}

/**
 * Data structure that contains all issued tokens that are not yet expired.
 * Expired tokens should be removed from this table periodically.
 */
export type IssueTable = Record<JTI, IssueRecord>
