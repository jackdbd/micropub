# Micropub

[![CI workflow](https://github.com/jackdbd/micropub/actions/workflows/ci.yaml/badge.svg)](https://github.com/jackdbd/micropub/actions/workflows/ci.yaml)

Packages for implementing an authorization server that supports the [IndieAuth protocol](https://indieauth.spec.indieweb.org/), a [Micropub](https://micropub.spec.indieweb.org/) server and a Micropub client.

## Packages

### Libraries

| Library | Description |
| :--- | :--- |
| [fastify-hooks](./src/lib/fastify-hooks/README.md) | Hooks shared by several Fastify plugins |
| [fastify-utils](./src/lib/fastify-utils/README.md) | Miscellaneous utilities for Fastify servers |
| [fs-jsonl-storage](./src/lib/fs-jsonl-storage/README.md) | Storage implementation (filesystem, JSON Lines) |
| [fs-json-storage](./src/lib/fs-json-storage/README.md) | Storage implementation (filesystem, JSON) |
| [github-storage](./src/lib/github-storage/README.md) | Storage implementation (GitHub repository) |
| [mem-atom-storage](./src/lib/mem-atom-storage/README.md) | Storage implementation (in-memory) |
| [microformats2](./src/lib/microformats2/README.md) | Schemas for microformats2 |
| [micropub](./src/lib/micropub/README.md) | Schemas and functions for implementing Micropub |
| [r2-storage](./src/lib/r2-storage/README.md) | Storage implementation (Cloudflare R2) |
| [schemas](./src/lib/schemas/README.md) | Miscellaneous schemas |
| [sqlite-storage](./src/lib/sqlite-storage/README.md) | Storage implementation (SQlite/LibSQL/Turso) |
| [storage-api](./src/lib/storage-api/README.md) | Storage API definition |
| [storage-implementations](./src/lib/storage-implementations/README.md) | Storage API implementations |
| [token](./src/lib/token/README.md) | Helper functions for working with JWT tokens |

### Fastify plugins

| Plugin | Description |
| :--- | :--- |
| [indieauth-client](./src/plugins/indieauth-client/README.md) | IndieAuth client |
| [introspection-endpoint](./src/plugins/introspection-endpoint/README.md) | IndieAuth token introspection endpoint |
| [media-endpoint](./src/plugins/media-endpoint/README.md) | media endpoint |
| [micropub-client](./src/plugins/micropub-client/README.md) | Micropub client |
| [micropub-endpoint](./src/plugins/micropub-endpoint/README.md) | micropub endpoint |
| [revocation-endpoint](./src/plugins/revocation-endpoint/README.md) | IndieAuth token revocation endpoint |
| [syndicate-endpoint](./src/plugins/syndicate-endpoint/README.md) | syndicate endpoint |
| [token-endpoint](./src/plugins/token-endpoint/README.md) | IndieAuth token endpoint |
| [userinfo-endpoint](./src/plugins/userinfo-endpoint/README.md) | IndieAuth userinfo endpoint |

See also:

- [Development](./docs/development.md)
- [Testing](./docs/testing.md)
- [Deploy](./docs/deploy.md)
- [Scripts](./scripts/README.md)

## TODO

- Use [SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn) (`@simplewebauthn/server` and `@simplewebauthn/browser`) for passkey authentication.
