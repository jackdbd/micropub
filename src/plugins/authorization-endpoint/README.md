# Authorization endpoint

Fastify plugin that adds an IndieAuth authorization endpoint to a Fastify server.

The authorization endpoint is used to interact with the resource owner and obtain an authorization grant. It's also used for verifying authorization codes.

In order to store/verify/retrieve authorization codes, a user of this plugin must implement the [authorization code storage interface](../../lib/authorization-code-storage-interface/README.md).

## References

- [Authorization Endpoint - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1)
- [Authorization request - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1)
- [Authorization response - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)
- [Authorization request - IndieAuth](https://indieauth.spec.indieweb.org/#authorization-request)
- [Authorization response - IndieAuth](https://indieauth.spec.indieweb.org/#x5-2-1-authorization-response)
- [IndieAuth scopes](https://indieweb.org/scope#IndieAuth_Scopes): `email`, `profile`
- [Micropub scopes](https://indieweb.org/scope#Microsub_Scopes): `create`, `update`, `delete`, `undelete`, `draft`, `media`
