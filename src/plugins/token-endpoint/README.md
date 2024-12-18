# Token endpoint

Fastify plugin that adds a token endpoint to a Fastify server.

An IndieAuth Token Endpoint is responsible for generating and verifying OAuth 2.0 Bearer Tokens.

It is up to the authorization endpoint how to authenticate the user. This step is out of scope of OAuth 2.0, and is highly dependent on the particular implementation. Some authorization servers use typical username/password authentication, and others use alternative forms of authentication such as [RelMeAuth](https://indieweb.org/RelMeAuth), or delegate to other identity providers.

## References

- [The OAuth 2.0 Authorization Framework (RFC6749) - Authorization response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)
- [IndieAuth - Authorization response](https://indieauth.spec.indieweb.org/#x5-2-1-authorization-response)
- [IndieAuth Token Endpoint](https://indieauth.spec.indieweb.org/#token-endpoint-p-1)
- [The OAuth 2.0 Authorization Framework (RFC6749) - Issuing an Access Token](https://datatracker.ietf.org/doc/html/rfc6749#section-5)
