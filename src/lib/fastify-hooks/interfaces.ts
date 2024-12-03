export type ClaimValue = string | number | boolean | Function

export type Operation = '==' | '!=' | '<' | '<=' | '>' | '>='

export interface Assertion {
  claim: string
  op?: Operation
  value?: ClaimValue
}

export type Claims = Record<string, ClaimValue>
