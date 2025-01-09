# Micropub

[![CI workflow](https://github.com/jackdbd/micropub/actions/workflows/ci.yaml/badge.svg)](https://github.com/jackdbd/micropub/actions/workflows/ci.yaml)

Packages for implementing an authorization server that supports the [IndieAuth protocol](https://indieauth.spec.indieweb.org/), a [Micropub](https://micropub.spec.indieweb.org/) server and a Micropub client.

## Packages

### Libraries

| Library | Description |
| :--- | :--- |
| [authorization-code-storage-interface](./src/lib/authorization-code-storage-interface/README.md) | Storage interface for authorization codes |
| [clients-storage-interface](./src/lib/clients-storage-interface/README.md) | Storage interface for IndieAuth clients |
| [fastify-errors](./src/lib/fastify-errors/README.md) | Consistent errors for OAuth 2.0 / IndieAuth / Micropub servers |
| [fastify-hooks](./src/lib/fastify-hooks/README.md) | Hooks shared by several Fastify plugins |
| [fastify-utils](./src/lib/fastify-utils/README.md) | Miscellaneous utilities for Fastify servers |
| [fs-storage](./src/lib/fs-storage/README.md) | Storage implementation (filesystem) |
| [github-storage](./src/lib/github-storage/README.md) | Storage implementation (GitHub repository) |
| [in-memory-storage](./src/lib/in-memory-storage/README.md) | Storage implementation (in-memory) |
| [indieauth](./src/lib/indieauth/README.md) | Schemas and functions for working with IndieAuth |
| [microformats2](./src/lib/microformats2/README.md) | Schemas for microformats2 |
| [micropub](./src/lib/micropub/README.md) | Schemas and functions for implementing Micropub |
| [pkce](./src/lib/pkce/README.md) | Schemas and functions for implementing Authorization Code Flow with Proof Key for Code Exchange (PKCE) |
| [profile-storage-interface](./src/lib/profile-storage-interface/README.md) | Storage interface for profile URLs |
| [r2-storage](./src/lib/r2-storage/README.md) | Storage implementation (Cloudflare R2) |
| [relmeauth](./src/lib/relmeauth/README.md) | Schemas and functions for working with RelMeAuth |
| [schemas](./src/lib/schemas/README.md) | Miscellaneous schemas |
| [sqlite-storage](./src/lib/sqlite-storage/README.md) | Storage implementation (SQlite/LibSQL/Turso) |
| [token](./src/lib/token/README.md) | Helper functions for working with JWT tokens |
| [token-storage-interface](./src/lib/token-storage-interface/README.md) | Storage interface for token |

### Fastify plugins

| Plugin | Description |
| :--- | :--- |
| [authorization-endpoint](./src/plugins/authorization-endpoint/README.md) | IndieAuth authorization endpoint |
| [indieauth-client](./src/plugins/indieauth-client/README.md) | IndieAuth client |
| [introspection-endpoint](./src/plugins/introspection-endpoint/README.md) | IndieAuth token introspection endpoint |
| [media-endpoint](./src/plugins/media-endpoint/README.md) | media endpoint |
| [micropub-client](./src/plugins/micropub-client/README.md) | Micropub client |
| [micropub-endpoint](./src/plugins/micropub-endpoint/README.md) | micropub endpoint |
| [revocation-endpoint](./src/plugins/revocation-endpoint/README.md) | IndieAuth token revocation endpoint |
| [syndicate-endpoint](./src/plugins/syndicate-endpoint/README.md) | syndicate endpoint |
| [token-endpoint](./src/plugins/token-endpoint/README.md) | IndieAuth token endpoint |
| [userinfo-endpoint](./src/plugins/userinfo-endpoint/README.md) | IndieAuth userinfo endpoint |

## Development

In one terminal, start the web server in watch mode:

```sh
npm run watch

# or, if you use devenv:
dev
```

In another terminal, make some requests to the `/micropub` endpoint. For example:

```sh
curl "${BASE_URL}/micropub" \
  -d h=entry \
  -d "content=Hello World" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer some-access-token" | jq
```

If you don't want to copy and paste curl commands in the terminal, you can make requests using API clients like [Postman](https://www.postman.com/) or [Bruno](https://docs.usebruno.com/introduction/what-is-bruno) (see the Bruno collection in [assets](./assets/README.md)).

You can obtain a valid access token using any micropub client, for example [the one in this repository](./src/plugins/micropub-client/README.md), [Quill](https://quill.p3k.io/), [Micropublish](https://micropublish.net/) or [Indiekit](https://getindiekit.com/).

See also [scripts](./scripts/README.md).

## Test

In one terminal, watch TypeScript files and recompile all nunjucks templates:

```sh
npm run watch:src
```

In another terminal, watch the tests:

```sh
npm run watch:test
```

### Note

Create an [h-entry](http://microformats.org/wiki/h-entry) representing a [note](https://indieweb.org/note).

The `content` of an `h-entry` could be either a string...

```sh
curl "${BASE_URL}/micropub" \
  -d h=entry \
  -d "content=Hello World" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq
```

...or a JSON object with keys `value` and `html`.

```sh
curl "${BASE_URL}/micropub" \
  -d h=entry \
  -d "content={ \"value\": \"Hello World\", \"html\": \"<b>Hello</b> World\" }" \
  -d "published=1985-04-12T23:20:50.52Z" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq
```

### Like

Create an `h-entry` representing a [like](https://indieweb.org/like).

```sh
curl "${BASE_URL}/micropub" \
  -d h=entry \
  -d "like-of=http://othersite.example.com/permalink47" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq
```

### Repost

Create an `h-entry` representing a [repost](https://indieweb.org/repost).

```sh
curl "${BASE_URL}/micropub" \
  -d h=entry \
  -d "repost-of=https://example.com/post" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | jq
```

## Deploy

The CI takes care of deploying the app to Fly.io every time a new commit gets pushed to the `main` branch of the remote repository.

Whenever you need to update secrets on Fly.io, run these commands (see `devenv.nix`):

```sh
fly-secrets-set-github
fly-secrets-set-cloudflare
fly-secrets-set-secure-session-keys
fly-secrets-set-telegram
fly-secrets-set-turso
```

## TODO

- Use [SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn) (`@simplewebauthn/server` and `@simplewebauthn/browser`) for passkey authentication.
