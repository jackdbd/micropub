import { Static, Type } from '@sinclair/typebox'
import { jti } from '../jwt/index.js'
import { access_token as access_token_schema } from '../oauth2/index.js'
import { MarkTokenAsRevoked } from '../schemas/index.js'
import { failure } from '../schemas/failure.js'
import { verify } from '../token/index.js'

const revoke_access_token_success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    jti,
    message: Type.Optional(Type.String({ minLength: 1 }))
  })
})

// This CANNOT be used with a standard JSON Schema validator.
// https://github.com/sinclairzx81/typebox?tab=readme-ov-file#javascript-types
const revoke_access_token_result_promise = Type.Promise(
  Type.Union([failure, revoke_access_token_success])
)

export const options = Type.Object({
  revocation_reason: Type.Optional(Type.String({ minLength: 1 }))
})

export type Options = Static<typeof options>

const DESCRIPTION =
  'Revokes an access token from some storage (e.g. a database).'

// This would be ideal, but it CANNOT be used with a standard JSON Schema
// validator. However, we can still use its TypeScript type.
const revokeAccessToken_ = Type.Function(
  [access_token_schema, Type.Optional(options)],
  revoke_access_token_result_promise,
  {
    $id: 'revoke-access-token',
    description: DESCRIPTION
  }
)

export type RevokeAccessToken = Static<typeof revokeAccessToken_>

export const revokeAccessToken = Type.Any({ description: DESCRIPTION })

export interface Config {
  /**
   * The entity that issued the JWT, typically the Authorization Server.
   * The issuer identifier included in the server's metadata value issuer MUST
   * be identical to the `iss` parameter's value.
   * @see [RFC 9207 OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207.html)
   */
  issuer: string

  /**
   * The URL where a **public** JWKS can be found. Each JWT issued should have a
   * `kid` claim in the header. This `kid` identifies which JWK of the JWKS to
   * use for verifying the JWT.
   */
  jwks_url: URL

  /**
   * The function that performs the effect of marking the token as revoked and
   * persisting this information to some storage (e.g. a database).
   */
  markTokenAsRevoked: MarkTokenAsRevoked

  max_token_age: string
}

/**
 * Factory function for creating a `revokeAccessToken` function.
 *
 * To be able to revoke tokens, we must keep track of the tokens we issued. We
 * do this by assigning a unique identifier to each token we issue, and by
 * storing this identifier—along with some other piece of information—in some
 * persistent storage (e.g. a database, a service that provides object storage).
 */
export const defRevokeAccessToken = (config: Config) => {
  const { issuer, jwks_url, markTokenAsRevoked, max_token_age } = config

  const revokeAccessToken: RevokeAccessToken = async (jwt, options) => {
    const { error: verify_error, value: claims } = await verify({
      issuer,
      jwks_url,
      jwt,
      max_token_age
    })

    if (verify_error) {
      return { error: verify_error }
    }

    const { jti } = claims
    if (!jti) {
      return { error: new Error(`token was verified but it has no jti claim`) }
    }

    const { error, value } = await markTokenAsRevoked(jti, options)

    if (error) {
      return { error }
    }

    // The token revocation implementation might return a more detailed message,
    // so it's probably better to return that instead.
    let message: string
    if (value.message) {
      message = value.message
    } else {
      message = `Token ${jti} is revoked`
    }

    return { value: { jti, message } }
  }

  return revokeAccessToken
}
