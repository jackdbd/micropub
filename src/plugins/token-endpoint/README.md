# Token endpoint

Fastify plugin that adds an IndieAuth token endpoint to a Fastify server.

An IndieAuth Token Endpoint is responsible for generating and verifying OAuth 2.0 Bearer Tokens.

In order to store/retrieve access tokens and refresh tokens, a user of this plugin must implement the [token storage interface](../../lib/token-storage-interface/README.md).

It is up to the authorization endpoint how to authenticate the user. This step is out of scope of OAuth 2.0, and is highly dependent on the particular implementation. Some authorization servers use typical username/password authentication, and others use alternative forms of authentication such as [RelMeAuth](https://indieweb.org/RelMeAuth), or delegate to other identity providers.

## References

- [Authorization response - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)
- [Authorization response - IndieAuth](https://indieauth.spec.indieweb.org/#x5-2-1-authorization-response)
- [Token Endpoint - IndieAuth](https://indieauth.spec.indieweb.org/#token-endpoint-p-1)
- [Issuing an Access Token - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-5)
