# Micropub

[![CI workflow](https://github.com/jackdbd/micropub/actions/workflows/ci.yaml/badge.svg)](https://github.com/jackdbd/micropub/actions/workflows/ci.yaml)

Packages for implementing an authorization server that supports the [IndieAuth protocol](https://indieauth.spec.indieweb.org/), a [Micropub](https://micropub.spec.indieweb.org/) server and a Micropub client.

## Packages

### Libraries

| Library | Description |
| :--- | :--- |
| [fs-jsonl-storage](./src/lib/fs-jsonl-storage/README.md) | Storage implementation (filesystem, JSON Lines) |
| [fs-json-storage](./src/lib/fs-json-storage/README.md) | Storage implementation (filesystem, JSON) |
| [mem-atom-storage](./src/lib/mem-atom-storage/README.md) | Storage implementation (in-memory) |
| [schemas](./src/lib/schemas/README.md) | Miscellaneous schemas |
| [sqlite-storage](./src/lib/sqlite-storage/README.md) | Storage implementation (SQlite/LibSQL/Turso) |
| [storage-api](./src/lib/storage-api/README.md) | Storage API definition |
| [storage-implementations](./src/lib/storage-implementations/README.md) | Storage API implementations |

### Fastify plugins

| Plugin | Description |
| :--- | :--- |
| [micropub-client](./src/plugins/micropub-client/README.md) | Micropub client |
| [render-config](./src/plugins/render-config/README.md) | Render a configuration object as HTML |

See also:

- [Development](./docs/development.md)
- [Testing](./docs/testing.md)
- [Deploy](./docs/deploy.md)
- [Scripts](./scripts/README.md)

## TODO

- Use [SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn) (`@simplewebauthn/server` and `@simplewebauthn/browser`) for passkey authentication.
