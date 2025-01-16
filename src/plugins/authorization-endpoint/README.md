# Authorization endpoint

Fastify plugin that adds an [IndieAuth Authorization Endpoint](https://indieauth.spec.indieweb.org/#authorization-endpoint) to a Fastify server.

An IndieAuth Authorization Endpoint is responsible for obtaining authentication or authorization consent from the end user and generating and verifying authorization codes.

## Installation

TODO

## Configuration

TODO: add AJV schema with documentation generated automatically.

## Authorization codes

The [authorization codes](https://indieauth.spec.indieweb.org/#authorization-request) issued by the authorization endpoint implemented by this plugin are [Nano IDs](https://zelark.github.io/nano-id-cc/) generated with [nanoid](https://github.com/ai/nanoid).

## References

- [Redeeming the Authorization Code](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
- [Authorization Code Grant - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1)
- [Authorization Endpoint - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1)
- [Authorization Request - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1)
- [Authorization Response - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)
- [Authorization Request - IndieAuth](https://indieauth.spec.indieweb.org/#authorization-request)
- [Authorization Response - IndieAuth](https://indieauth.spec.indieweb.org/#x5-2-1-authorization-response)
- [IndieAuth Rocks! (validator for testing IndieAuth client and server implementations)](https://indieauth.rocks/)
- [IndieAuth scopes](https://indieweb.org/scope#IndieAuth_Scopes): `email`, `profile`
- [Micropub scopes](https://indieweb.org/scope#Microsub_Scopes): `create`, `update`, `delete`, `undelete`, `draft`, `media`
