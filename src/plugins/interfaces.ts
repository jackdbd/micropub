export interface AccessTokenPayload {
  me: string
  // issued_by: string
  client_id: string
  exp: number // will expire at timestamp
  iat: number // issued at timestamp
  // issued_at: number
  scope: string
  //   nonce: number
}
