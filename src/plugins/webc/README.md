# fastify-webc

Fastify plugin to render [WebC](https://github.com/11ty/webc/) templates and components.

- [Installation](#installation)
- [Configuration](#configuration)
- [TypeScript](#typescript)
- [Tips](#tips)
- [License](#license)

## Installation

```sh
npm install fastify-webc
```

## Configuration

Register this plugin by telling it where to find your WebC components and templates.

This plugin decorates `FastifyReply` with a `render` method. This method takes two arguments: a WebC template and an optional data object.

```ts
import webc from './plugins/webc/index.js'

fastify.register(webc, {
  components: [path.join(__dirname, 'components')],
  templates: [path.join(__dirname, 'templates')]
})

fastify.get('/demo', function (request, reply) {
  const data = { foo: 'bar' }
  return reply.render('demo.webc', data)
})
```

## TypeScript

To ensure TypeScript recognizes the `render` method as part of the `FastifyReply` object, you must use [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to extend the `FastifyReply` interface.

```ts
declare module 'fastify' {
  interface FastifyReply {
    render(template: string, data?: Record<string, any>): Promise<void>
  }
}
```

## Tips

You can access the WebC instance from your WebC template/component using `this.webc`.

```html
<code>this.webc</code>
<pre @text="JSON.stringify(this.webc, null, 2)"></pre>
```

You can access the data available to the WebC template/component using `this.$data`.

```html
<code>this.$data</code>
<pre @text="JSON.stringify(this.$data, null, 2)"></pre>
```

## References

- [eleventy-plugin-webc](https://github.com/11ty/eleventy-plugin-webc/)
- [eleventy-plugin-bundle](https://github.com/11ty/eleventy-plugin-bundle/)
- [express-webc](https://github.com/NickColley/express-webc)
- [koa-webc](https://github.com/sombriks/koa-webc/)

## TODO

In order to support [WebC bundler mode](https://www.11ty.dev/docs/languages/webc/#css-and-js-bundler-mode) I think I need to implement an `addBundle` method [like the one implemented in eleventy-plugin-bundle](https://github.com/11ty/eleventy-plugin-bundle/blob/f4b2ecf2d12e5b246eb69de12b83ac7e30003642/src/eleventy.bundleManagers.js#L16), and a `getBundle` WebC helper function [like the one implemented here](https://github.com/11ty/eleventy-plugin-bundle/blob/f4b2ecf2d12e5b246eb69de12b83ac7e30003642/src/eleventy.shortcodes.js#L27). See also the [getBundledAssets](https://github.com/11ty/webc/blob/a2f548c23490929aa8c9cd25159549eba3e869c7/src/assetManager.js#L29) method in WebC's `AssetManager` class.

This would allow users to include CSS/JS bundles in their WebC templates using this syntax:

```html
<head>
  <!-- 'default' is the name of the asset bucket -->
  <style @raw="getBundle('css', 'default')" webc:keep></style>

  <script type="module" @raw="getBundle('js', 'default')" webc:keep></script>
</head>
```

Should I contribute this plugin as a view engine for [@fastify/view](https://github.com/fastify/point-of-view/)?

## License

&copy; 2024 - 2025 [Giacomo Debidda](https://www.giacomodebidda.com/) // [MIT License](https://spdx.org/licenses/MIT.html)
