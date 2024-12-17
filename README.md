# Micropub

[![CI workflow](https://github.com/jackdbd/micropub/actions/workflows/ci.yaml/badge.svg)](https://github.com/jackdbd/micropub/actions/workflows/ci.yaml)

## Installation

```sh
npm install
```

## Development

In one terminal, start the web server in watch mode:

```sh
npm run watch
# or just: dev
```

In another terminal, make some requests to the `/micropub` endpoint.

```sh
curl "${BASE_URL}/micropub" \
  -X POST \
  -d h=entry \
  -d "content=Hello World" \
  -H "Accept: application/json" | jq
```

```sh
curl "${BASE_URL}/micropub" \
  -d h=entry \
  -d "content=Hello World" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer invalid-token" | jq
```

If you don't want to copy and paste curl commands in the terminal, you can make requests using API clients like [Postman](https://www.postman.com/) or [Bruno](https://docs.usebruno.com/introduction/what-is-bruno) (see the Bruno collection in [assets](./assets/README.md)).

Obtain a valid access token using a micropub client, for example [Quill](https://quill.p3k.io/), [Micropublish](https://micropublish.net/) or [Indiekit](https://getindiekit.com/).

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

Whenever you need to update secrets on Fly.io, use these commands (see `devenv.nix`):

```sh
fly-secrets-set-github
fly-secrets-set-cloudflare
fly-secrets-set-secure-session-keys
fly-secrets-set-telegram
```
