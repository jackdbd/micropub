# Development

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

If you don't want to copy and paste curl commands in the terminal, you can make requests using API clients like [Postman](https://www.postman.com/) or [Bruno](https://docs.usebruno.com/introduction/what-is-bruno) (see the Bruno collection in [assets](../assets/README.md)).

You can obtain a valid access token using any micropub client, for example [the one in this repository](./src/plugins/micropub-client/README.md), [Quill](https://quill.p3k.io/), [Micropublish](https://micropublish.net/) or [Indiekit](https://getindiekit.com/).

See also [scripts](../scripts/README.md).
