# {{pkg.name}}

Fastify plugin that adds an [IndieAuth Authorization Endpoint](https://indieauth.spec.indieweb.org/#authorization-endpoint) to a Fastify server.

An IndieAuth Authorization Endpoint is responsible for obtaining authentication or authorization consent from the end user and generating and verifying authorization codes.

<!-- toc -->

{{pkg.installation}}

{{pluginOptions}}

## Obtaining an authorization code

When the end user accesses the authorization endpoint, they are presented with a [consent screen](https://indieweb.org/consent_screen). The details displayed on the consent screen are populated based on the information provided in the query string of the request.

{{authorizationRequestQuerystring}}

## Verifying the authorization code

To verify that the authorization code is valid, the token endpoint of the authorization server makes a POST request to the authorization endpoint.

{{accessTokenRequestBody}}

<!-- {{pkg.deps}} -->

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

{{pkg.license}}
