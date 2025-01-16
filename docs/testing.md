# Testing

In one terminal, watch TypeScript files and recompile all nunjucks templates:

```sh
npm run watch:src
```

In another terminal, watch the tests:

```sh
npm run watch:test
```

## IndieWeb post categories

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
