# fastify-introspection-endpoint

Fastify plugin that adds an [IndieAuth Token Introspection Endpoint](https://indieauth.spec.indieweb.org/#access-token-verification) to a Fastify server.

IndieAuth extends OAuth 2.0 Token Introspection by adding that the introspection response MUST include an additional parameter, `me`.

- [Installation](#installation)
- [Fastify plugin introspection\-endpoint options](#fastify-plugin-introspection-endpoint-options)
  - [jwksUrl: JWKS public URL](#jwksurl-jwks-public-url)
- [References](#references)
- [License](#license)

## Installation

```sh
npm install fastify-introspection-endpoint
```

## Fastify plugin introspection\-endpoint options

Options for the Fastify introspection-endpoint plugin

**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**ajv**||Instance of Ajv<br/>|no|
|**includeErrorDescription**|`boolean`|Default: `false`<br/>|no|
|**isAccessTokenRevoked**|`Function`|Predicate function that returns true if a jti (JSON Web Token ID) is revoked.<br/>|yes|
|**issuer**|`string`|The authorization server's issuer identifier. It's a URL that uses the "https" scheme and has no query or fragment components. It MUST also be a prefix of the indieauth-metadata URL.<br/>Format: `"uri"`<br/>|yes|
|[**jwksUrl**](#jwksurl)<br/>(JWKS public URL)|`object`|URL where the public JSON Web Key Set is hosted.<br/>|yes|
|**logPrefix**|`string`|Default: `"introspection-endpoint "`<br/>|no|
|**reportAllAjvErrors**<br/>(report all AJV errors)|`boolean`|Whether to report all AJV validation errors.<br/>Default: `false`<br/>|no|

**Example**

```json
{
    "includeErrorDescription": false,
    "jwksUrl": {},
    "logPrefix": "introspection-endpoint ",
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

- [OAuth 2.0 Token Introspection (RFC 7662)](https://www.rfc-editor.org/rfc/rfc7662)
- [Access Token Verification Request - IndieAuth](https://indieauth.spec.indieweb.org/#access-token-verification-request)
- [Access Token Verification Response - IndieAuth](https://indieauth.spec.indieweb.org/#access-token-verification-response)
- [Introspection Request - OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662#section-2.1)
- [Introspection Response - OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662#section-2.2)

## License

&copy; 2024 - 2025 [Giacomo Debidda](https://www.giacomodebidda.com/) // [MIT License](https://spdx.org/licenses/MIT.html)
