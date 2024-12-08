// According to jose's JWTPayload interface, the aud claim could be string or string[].
export type Value = string | string[] | number | boolean | undefined

export type Operation = '==' | '!=' | '<' | '<=' | '>' | '>='

export interface Assertion {
  claim: string
  op?: Operation
  value?: Value | Function
}
