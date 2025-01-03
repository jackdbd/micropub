# Token Introspection endpoint

Fastify plugin that adds an [IndieAuth Token Introspection Endpoint](https://indieauth.spec.indieweb.org/#access-token-verification) to a Fastify server.

IndieAuth extends OAuth 2.0 Token Introspection by adding that the introspection response MUST include an additional parameter, `me`.

## Installation

TODO

## Configuration

TODO: add AJV schema with documentation generated automatically.

## References

- [OAuth 2.0 Token Introspection (RFC 7662)](https://www.rfc-editor.org/rfc/rfc7662)
- [Access Token Verification Request - IndieAuth](https://indieauth.spec.indieweb.org/#access-token-verification-request)
- [Access Token Verification Response - IndieAuth](https://indieauth.spec.indieweb.org/#access-token-verification-response)
- [Introspection Request - OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662#section-2.1)
- [Introspection Response - OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662#section-2.2)
