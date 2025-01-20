# fastify-userinfo-endpoint

Fastify plugin that adds a [userinfo endpoint](https://indieauth.spec.indieweb.org/#user-information) to a Fastify server.

- [Installation](#installation)
- [Userinfo Endpoint Options](#userinfo-endpoint-options)
- [References](#references)
- [License](#license)

## Installation

```sh
npm install fastify-userinfo-endpoint
```

## Userinfo Endpoint Options

Options for the Fastify userinfo-endpoint plugin

**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**ajv**||Instance of Ajv<br/>|no|
|**isAccessTokenRevoked**|`Function`|Predicate function that returns true if a jti (JSON Web Token ID) is revoked.<br/>|yes|
|**includeErrorDescription**|`boolean`|Default: `false`<br/>|no|
|**logPrefix**|`string`|Default: `"userinfo-endpoint "`<br/>|no|
|**reportAllAjvErrors**<br/>(report all AJV errors)|`boolean`|Whether to report all AJV validation errors.<br/>Default: `false`<br/>|no|
|**retrieveProfile**||Function that retrieves a user's profile from some storage.<br/>|yes|

**Example**

```json
{
    "includeErrorDescription": false,
    "logPrefix": "userinfo-endpoint ",
    "reportAllAjvErrors": false
}
```

## References

- [Profile Information - IndieAuth](https://indieauth.spec.indieweb.org/#x5-3-4-profile-information)
- [Verifying the User Info (oauth.com)](https://www.oauth.com/oauth2-servers/signing-in-with-google/verifying-the-user-info/)
- [UserInfo - Retrieving details about the logged-in user (connect2id.com)](https://connect2id.com/products/server/docs/api/userinfo)

## License

&copy; 2024 - 2025 [Giacomo Debidda](https://www.giacomodebidda.com/) // [MIT License](https://spdx.org/licenses/MIT.html)
