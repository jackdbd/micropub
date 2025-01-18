# fastify-revocation-endpoint

Fastify plugin that adds an [IndieAuth Token Revocation endpoint](https://indieauth.spec.indieweb.org/#token-revocation) to a Fastify server.

- [Installation](#installation)
- [Revocation Endpoint Options](#revocation-endpoint-options)
  - [jwksUrl: JWKS public URL](#jwksurl-jwks-public-url)
- [References](#references)
- [License](#license)

## Installation

```sh
npm install fastify-revocation-endpoint
```

## Revocation Endpoint Options

Options for the Fastify revocation-endpoint plugin

**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**ajv**||Instance of Ajv<br/>|no|
|**includeErrorDescription**|`boolean`|Whether to include an<br/>`error_description` property in all error responses.<br/>This is meant to assist the client developer in understanding the error.<br/>This is NOT meant to be shown to the end user.<br/>Default: `false`<br/>|no|
|**isAccessTokenRevoked**|`Function`|Predicate function that returns true if a jti (JSON Web Token ID) is revoked.<br/>|yes|
|**issuer**|`string`|The authorization server's issuer identifier. It's a URL that uses the "https" scheme and has no query or fragment components. It MUST also be a prefix of the indieauth-metadata URL.<br/>Format: `"uri"`<br/>|yes|
|[**jwksUrl**](#jwksurl)<br/>(JWKS public URL)|`object`|URL where the public JSON Web Key Set is hosted.<br/>|yes|
|**logPrefix**|`string`|Default: `"revocation-endpoint "`<br/>|no|
|**maxAccessTokenAge**|`string`|Minimal Length: `1`<br/>|no|
|**me**|||yes|
|**reportAllAjvErrors**<br/>(report all AJV errors)|`boolean`|Whether to report all AJV validation errors.<br/>Default: `false`<br/>|no|
|**retrieveAccessToken**|`Function`|Function that retrieves an access token from a storage backend.<br/>|yes|
|**retrieveRefreshToken**|`Function`|Function that retrieves a refresh token from a storage backend.<br/>|yes|
|**revokeAccessToken**|`Function`|Handler invoked when the token revocation endpoint has met all requirements to revoke a token. You should use it to mark the access token as revoked in your storage backend.<br/>|yes|
|**revokeRefreshToken**|`Function`|Handler invoked when the token revocation endpoint has met all requirements to revoke a token. You should use it to mark the refresh token as revoked in your storage backend.<br/>|yes|

**Example**

```json
{
    "includeErrorDescription": false,
    "jwksUrl": {},
    "logPrefix": "revocation-endpoint ",
    "reportAllAjvErrors": false
}
```

<a name="jwksurl"></a>
### jwksUrl: JWKS public URL

URL where the public JSON Web Key Set is hosted.

**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**hash**|`string`||yes|
|**host**|`string`||yes|
|**href**|`string`||yes|
|**hostname**|`string`||yes|
|**origin**|`string`||yes|
|**password**|`string`||yes|
|**pathname**|`string`||yes|
|**port**|`string`||yes|
|**protocol**|`string`||yes|
|**search**|`string`||yes|
|**searchParams**|||yes|
|**username**|`string`||yes|
|**toJSON**|||yes|

**Additional Properties:** allowed  

## References

- [OAuth 2.0 Token Revocation (RFC 7009)](https://www.rfc-editor.org/rfc/rfc7009.html)
- [Token revocation on OAuth.net](https://oauth.net/2/token-revocation/)

## License

&copy; 2024 - 2025 [Giacomo Debidda](https://www.giacomodebidda.com/) // [MIT License](https://spdx.org/licenses/MIT.html)
