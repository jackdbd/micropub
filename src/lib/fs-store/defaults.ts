export const DEFAULT_STORE_NAME = 'Filesystem'

export const DEFAULT_TOKEN_ALGORITHM = 'HS256'
export const DEFAULT_TOKEN_BLACKLIST = [] as string[]
export const DEFAULT_TOKEN_EXPIRATION = '1 hour'
export const DEFAULT_TOKEN_ISSUELIST = [] as string[]
// Should I have a default issuer?
export const DEFAULT_TOKEN_ISSUER = 'fs-store-default-issuer'
export const DEFAULT_TOKEN_BLACKLIST_PATH = 'fs-store-token-blacklist.json'
export const DEFAULT_TOKEN_ISSUELIST_PATH = 'fs-store-token-issuelist.json'
export const DEFAULT_TOKEN_JWK_PATH = 'fs-store-token-jwk.json'
