# fastify-token-endpoint

Fastify plugin that adds an [IndieAuth Token Endpoint](https://indieauth.spec.indieweb.org/#token-endpoint) to a Fastify server.

An IndieAuth Token Endpoint is responsible for generating and verifying OAuth 2.0 Bearer Tokens.

- [Installation](#installation)
- [Token Endpoint Options](#token-endpoint-options)
  - [jwks: object](#jwks-object)
    - [jwks\.keys\[\]: array](#jwkskeys-array)
- [Access tokens](#access-tokens)
- [Refresh tokens](#refresh-tokens)
- [References](#references)
- [License](#license)

## Installation

```sh
npm install fastify-token-endpoint
```

## Token Endpoint Options

Options for the Fastify token-endpoint plugin

**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**accessTokenExpiration**<br/>(Token expiration)|`string`|Human-readable expiration time for the token issued by the token endpoint.<br/>Default: `"15 minutes"`<br/>Minimal Length: `1`<br/>|no|
|**ajv**||Instance of Ajv<br/>|no|
|**authorizationEndpoint**<br/>(Authorization endpoint)|`string`|URL of the authorization server's authorization endpoint.<br/>Format: `"uri"`<br/>|yes|
|**includeErrorDescription**|`boolean`|Whether to include an<br/>`error_description` property in all error responses.<br/>This is meant to assist the client developer in understanding the error.<br/>This is NOT meant to be shown to the end user.<br/>Default: `false`<br/>|no|
|**isAccessTokenRevoked**|`Function`|Predicate function that returns true if a jti (JSON Web Token ID) is revoked.<br/>|yes|
|**issuer**|`string`|The authorization server's issuer identifier. It's a URL that uses the "https" scheme and has no query or fragment components. It MUST also be a prefix of the indieauth-metadata URL.<br/>Format: `"uri"`<br/>|yes|
|[**jwks**](#jwks)|`object`||yes|
|**logPrefix**|`string`|Default: `"token-endpoint "`<br/>|no|
|**onIssuedTokens**|`Function`|Handler invoked when the token endpoint has issued an access token and a refresh token. You should use it to persist the tokens to storage.<br/>|yes|
|**refreshTokenExpiration**<br/>(Token expiration)|`string`|Human-readable expiration time for the token issued by the token endpoint.<br/>Default: `"30 days"`<br/>Minimal Length: `1`<br/>|no|
|**reportAllAjvErrors**<br/>(report all AJV errors)|`boolean`|Whether to report all AJV validation errors.<br/>Default: `false`<br/>|no|
|**retrieveRefreshToken**|`Function`|Function that retrieves a refresh token from a storage backend.<br/>|yes|
|**revocationEndpoint**<br/>(Revocation endpoint)|`string`|URL of the authorization server's OAuth 2.0 revocation endpoint.<br/>Format: `"uri"`<br/>|yes|
|**userinfoEndpoint**<br/>(Userinfo endpoint)|`string`|Format: `"uri"`<br/>|yes|

**Example**

```json
{
    "accessTokenExpiration": "15 minutes",
    "includeErrorDescription": false,
    "jwks": {
        "keys": [
            {}
        ]
    },
    "logPrefix": "token-endpoint ",
    "refreshTokenExpiration": "30 days",
    "reportAllAjvErrors": false
}
```

<a name="jwks"></a>
### jwks: object

**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**keys**](#jwkskeys)|`object[]`||yes|

**Example**

```json
{
    "keys": [
        {}
    ]
}
```

<a name="jwkskeys"></a>
#### jwks\.keys\[\]: array

**Items**

**Item Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**alg**|`string`|Minimal Length: `1`<br/>|no|
|**d**|`string`|Minimal Length: `1`<br/>|no|
|**dp**|`string`|Minimal Length: `1`<br/>|no|
|**dq**|`string`|Minimal Length: `1`<br/>|no|
|**e**|`string`|Minimal Length: `1`<br/>|no|
|**kid**|`string`|Minimal Length: `1`<br/>|no|
|**kty**|`string`|Minimal Length: `1`<br/>|yes|
|**n**|`string`|Minimal Length: `1`<br/>|no|
|**p**|`string`|Minimal Length: `1`<br/>|no|
|**q**|`string`|Minimal Length: `1`<br/>|no|
|**qi**|`string`|Minimal Length: `1`<br/>|no|

**Example**

```json
[
    {}
]
```

## Access tokens

The [access tokens](https://datatracker.ietf.org/doc/html/rfc6749#section-1.4) issued by the token endpoint implemented by this plugin are JSON Web Tokens.

Each JWT issued by this token endpoint is **signed** with RS256 using a random [JSON Web Key (JWK)](https://datatracker.ietf.org/doc/html/rfc7517) from a given **private** [JWK Set](https://datatracker.ietf.org/doc/html/rfc7517#section-5).

Each JWT issued by this token endpoint can be **verified** by anyone (for example by a [revocation endpoint](https://www.rfc-editor.org/rfc/rfc7009) or an [introspection endpoint](https://datatracker.ietf.org/doc/html/rfc7662)) using the [the `kid` parameter](https://datatracker.ietf.org/doc/html/rfc7517#section-4.5) from the matching **public** JWK Set.

> [!WARNING]
> Since neither OAuth 2.0 nor IndieAuth require an access token to be implemented as a JSON Web Token, I am considering other implementations. Watch the talk [Rethinking Authentication](https://youtu.be/VhRbvTdX9Ug?si=nvl3HvbzzdTPCght) to learn more about possible alternative implementations for access tokens.

## Refresh tokens

The [refresh tokens](https://indieauth.spec.indieweb.org/#refresh-tokens) issued by the token endpoint implemented by this plugin are [Nano IDs](https://zelark.github.io/nano-id-cc/) generated with [nanoid](https://github.com/ai/nanoid).

> [!TIP]
> Read the article [Why we chose NanoIDs for PlanetScale’s API](https://planetscale.com/blog/why-we-chose-nanoids-for-planetscales-api) for a comparison of Nano ID with UUIDs.

## References

- [Issuing an Access Token - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-5)
- [Refreshing an Access Token - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-6)
- [Access Token Response - IndieAuth](https://indieauth.spec.indieweb.org/#access-token-response)
- [IndieAuth Rocks! (validator for testing IndieAuth client and server implementations)](https://indieauth.rocks/)
- [IndieAuth scopes](https://indieweb.org/scope#IndieAuth_Scopes): `email`, `profile`
- [Micropub scopes](https://indieweb.org/scope#Microsub_Scopes): `create`, `update`, `delete`, `undelete`, `draft`, `media`

## License

&copy; 2024 - 2025 [Giacomo Debidda](https://www.giacomodebidda.com/) // [MIT License](https://spdx.org/licenses/MIT.html)
