type JTI = string

export interface IssueRecord {
  exp: number
  iat: number
  revoked?: boolean
  revocation_reason?: string
}

export type IssueTable = Record<JTI, IssueRecord>
