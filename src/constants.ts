// keep these ones in sync with schema.hcl
export const ACCESS_TOKEN_RECORD_KEYS = [
  'jti',
  'client_id',
  'redirect_uri',
  'revoked',
  'revocation_reason'
]

export const AUTHORIZATION_CODE_RECORD_KEYS = [
  'code',
  'client_id',
  'code_challenge',
  'code_challenge_method',
  'exp',
  'iss',
  'me',
  'redirect_uri',
  'scope',
  'used'
]

export const CLIENT_APPLICATION_RECORD_KEYS = [
  'client_id',
  'me',
  'redirect_uri'
]

export const REFRESH_TOKEN_RECORD_KEYS = [
  'refresh_token',
  'client_id',
  'exp',
  'iss',
  'jti',
  'me',
  'redirect_uri',
  'scope',
  'revoked',
  'revocation_reason'
]

export const USER_PROFILE_RECORD_KEYS = ['me', 'email', 'name', 'photo', 'url']
