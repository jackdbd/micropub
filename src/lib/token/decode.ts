import * as jose from 'jose'
import type { AccessTokenClaims } from './claims.ts'

// export interface DecodeConfig {
//   jwt: string
// }

// export const decode = ({ jwt }: DecodeConfig) => {
//   return jose.decodeJwt(jwt) as unknown as AccessTokenClaims
// }

export const safeDecode = async (jwt: string) => {
  try {
    const value = jose.decodeJwt(jwt) as unknown as AccessTokenClaims
    return { value }
  } catch (err) {
    return { error: err as Error }
  }
}
