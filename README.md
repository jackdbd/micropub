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
```

In another terminal make some requests to the `/micropub` endpoint. You could also use any other HTTP client to make requests, for example Postman.

```sh
curl "${HOST}:3001/micropub" \
  -d h=entry \
  -d "content=Hello World" \
  -H "Accept: application/json" | jq
```

```sh
curl "${HOST}:3001/micropub" \
  -d h=entry \
  -d "content=Hello World" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer invalid-token" | jq
```

Obtain a valid access token using a micropub client, for example [Quill](https://quill.p3k.io/), [Micropublish](https://micropublish.net/) or [Indiekit](https://getindiekit.com/).

### Note

Create an [h-entry](http://microformats.org/wiki/h-entry) representing a [note](https://indieweb.org/note).

The `content` of an `h-entry` could be either a string...

```sh
curl "${HOST}:3001/micropub" \
  -d h=entry \
  -d "content=Hello World" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $(cat secrets/token-endpoint-response.json | jq .access_token)" | jq
```

...or a JSON object with keys `value` and `html`.

```sh
curl "${HOST}:3001/micropub" \
  -d h=entry \
  -d "content={ \"value\": \"Hello World\", \"html\": \"<b>Hello</b> World\" }" \
  -d "published=1985-04-12T23:20:50.52Z" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $(cat secrets/token-endpoint-response.json | jq .access_token)" | jq
```

### Like

Create an `h-entry` representing a [like](https://indieweb.org/like).

```sh
curl "${HOST}:3001/micropub" \
  -d h=entry \
  -d "like-of=http://othersite.example.com/permalink47" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $(cat secrets/token-endpoint-response.json | jq .access_token)" | jq
```

### Repost

Create an `h-entry` representing a [repost](https://indieweb.org/repost).

```sh
curl "${HOST}:3001/micropub" \
  -d h=entry \
  -d "repost-of=https://example.com/post" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $(cat secrets/token-endpoint-response.json | jq .access_token)" | jq
```
