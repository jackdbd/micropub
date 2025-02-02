import assert from 'node:assert'
import {
  // randomKid,
  // safeDecode,
  // sign,
  unixTimestampInSeconds
} from '@jackdbd/oauth2-tokens'
import { code_challenge, code_challenge_method } from '@jackdbd/pkce'
import { unwrapP } from '@jackdbd/unwrap'
import { defStorage } from '../dist/lib/storage-implementations/index.js'
import { defAjv } from '../dist/ajv.js'
import { defFastify } from '../dist/app.js'
import { defConfig } from '../dist/config.js'
// import * as DEFAULT from '../dist/defaults.js'

export const ISSUER = 'https://authorization-server.com/'
export const ME = 'https://resource-owner.com/me'
export const CLIENT_ID = 'https://client-application.com/id'
export const PROFILE_EMAIL = 'john.doe@email.com'
export const PROFILE_NAME = 'John Doe'
export const PROFILE_URL = 'https://john-doe.com/'
export const PROFILE_PHOTO = 'https://john-doe.com/photo.jpeg'
export const REDIRECT_URI = 'https://client-application.com/auth/callback'
export const SCOPE = 'create update profile email'

export const AUTHORIZATION_CODE_EXPIRATION_IN_SECONDS = 5
export const AUTHORIZATION_CODE_EXPIRATION = `${AUTHORIZATION_CODE_EXPIRATION_IN_SECONDS} seconds`
export const ACCESS_TOKEN_EXPIRATION_IN_SECONDS = 10
export const ACCESS_TOKEN_EXPIRATION = `${ACCESS_TOKEN_EXPIRATION_IN_SECONDS} seconds`
export const REFRESH_TOKEN_EXPIRATION_IN_SECONDS = 30
export const REFRESH_TOKEN_EXPIRATION = `${REFRESH_TOKEN_EXPIRATION_IN_SECONDS} seconds`

export const ajv = defAjv({ schemas: [code_challenge, code_challenge_method] })
const backend = 'mem-atom'
// // const backend = 'sqlite'
const environment = 'dev'

// // In some environments (e.g. Fly.io) we need to set JWKS as an escaped JSON
// // string (e.g. "{\"keys\":[]}"). So in those environments we need to call
// // JSON.parse twice to build the actual JS object.
// let jwks = JSON.parse(DEFAULT.JWKS)
// if (typeof jwks === 'string') {
//   jwks = JSON.parse(jwks)
// }
// export { jwks }

// export const jwks_url = new URL(DEFAULT.JWKS_PUBLIC_URL)

export const accessTokenAPI = () => {
  const { value: storage } = defStorage({ ajv, backend, env: environment })
  return storage.access_token
}

export const authorizationCodeAPI = () => {
  const { value: storage } = defStorage({ ajv, backend, env: environment })
  return storage.authorization_code
}

export const clientApplicationAPI = () => {
  const { value: storage } = defStorage({ ajv, backend, env: environment })
  return storage.client_application
}

export const refreshTokenAPI = () => {
  const { value: storage } = defStorage({ ajv, backend, env: environment })
  return storage.refresh_token
}

export const userProfileAPI = () => {
  const { value: storage } = defStorage({ ajv, backend, env: environment })
  return storage.user_profile
}

export const defTestApp = async () => {
  const config = await defConfig()
  return await defFastify(config)
}

// export const issueJWT = async (payload = {}) => {
//   const { error: kid_error, value: kid } = randomKid(jwks.keys)
//   assert.ok(!kid_error)

//   const expiration = ACCESS_TOKEN_EXPIRATION
//   const issuer = ISSUER

//   const { error, value: jwt } = await sign({
//     expiration,
//     issuer,
//     jwks,
//     kid,
//     payload
//   })
//   assert.ok(!error)
//   assert.ok(jwt)

//   return { expiration, issuer, jwt }
// }

// export const REQUIRED_CLAIMS = ['exp', 'iat', 'iss', 'jti']

// export const assertTokenHasExpectedClaims = async ({ jwt, claims }) => {
//   const { error, value: actual_claims } = await safeDecode(jwt)

//   assert.ok(!error)

//   claims.forEach((claim) => {
//     assert.ok(actual_claims[claim])
//   })
// }

export const storeAccessTokens = async ({ storage, jtis }) => {
  await Promise.all(
    jtis.map((jti) => {
      return unwrapP(
        storage.storeOne({
          client_id: CLIENT_ID,
          jti,
          redirect_uri: REDIRECT_URI
        })
      )
    })
  )
}

export const storeRefreshTokens = async ({ storage, jtis, refresh_tokens }) => {
  await Promise.all(
    jtis.map((jti, i) => {
      return unwrapP(
        storage.storeOne({
          client_id: CLIENT_ID,
          exp: unixTimestampInSeconds() + REFRESH_TOKEN_EXPIRATION_IN_SECONDS,
          iss: ISSUER,
          jti,
          me: ME,
          redirect_uri: REDIRECT_URI,
          refresh_token: refresh_tokens[i],
          scope: SCOPE
        })
      )
    })
  )
}

export const assertNoAccessTokenIsRevoked = async ({ storage }) => {
  const { value: records } = await storage.retrieveMany()

  records.forEach((record) => {
    assert.notEqual(record.revoked, true)
    assert.equal(record.revocation_reason, undefined)
  })
}

export const assertNoRefreshTokenIsRevoked = async ({ storage }) => {
  const { value: records } = await storage.retrieveMany()

  records.forEach((record) => {
    assert.notEqual(record.revoked, true)
    assert.equal(record.revocation_reason, undefined)
  })
}

export const revokeTokensByJTI = async ({
  storage,
  jtis,
  revocation_reason
}) => {
  const where = jtis.map((jti) => ({ key: 'jti', op: '==', value: jti }))
  await unwrapP(
    storage.updateMany({
      where,
      condition: 'OR',
      set: { revoked: true, revocation_reason }
    })
  )
}

// export const waitMs = (ms) => {
//   let timeout
//   return new Promise((resolve) => {
//     timeout = setTimeout(() => {
//       resolve()
//       clearTimeout(timeout)
//     }, ms)
//   })
// }
