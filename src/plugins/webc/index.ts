import path from 'node:path'
import type { TransformCallback } from '@11ty/webc'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { defRender, type Helpers, type Transforms } from './decorators.js'
import { tap } from './helpers.js'

export { tap } from './helpers.js'

export type Helper =
  | Function
  | { name: string; fn: Function; isScoped?: boolean }

export type Transform =
  | TransformCallback
  | { name: string; fn: TransformCallback }

export interface Options {
  /**
   * Where to find your WebC components. You can specify your WebC components
   * using a single glob, an array of globs, or a hash map in the format
   * component name -> glob.
   *
   * @see [Register Global Components - WebC](https://github.com/11ty/webc/tree/main#register-global-components)
   */
  components?: string | string[] | Record<string, string>

  /**
   * [Helper Functions](https://github.com/11ty/webc?tab=readme-ov-file#helper-functions) to attach to the WebC instance.
   */
  helpers?: Helper[]

  /**
   * Directories where to find your WebC templates.
   */
  templates?: string[]

  /**
   * [Custom Transforms](https://github.com/11ty/webc?tab=readme-ov-file#custom-transforms) to attach to the WebC instance.
   */
  transforms?: Transform[]

  /**
   * Whether to enable WebC bundler mode or not.
   *
   * Enabling Bundler Mode aggregates all CSS and JS found in all WebC
   * components that belong to the same [asset bucket](https://www.11ty.dev/docs/languages/webc/#asset-bucketing).
   *
   * @warning Not supported at the moment.
   * @see [Aggregating CSS and JS - WebC](https://github.com/11ty/webc?tab=readme-ov-file#aggregating-css-and-js)
   */
  useBundlerMode?: boolean
}

// Try to use the same defaults as eleventy-plugin-webc
// https://github.com/11ty/eleventy-plugin-webc/blob/b5d39d55b330990280a9fea34dbf4fcd3d3d25a6/eleventyWebcPlugin.js#L19
export const defaults = {
  components: ['components/**/*.webc'],
  helpers: [tap] as Helper[],
  logPrefix: '[fastify-webc] ',
  templates: [path.join(process.cwd(), 'templates')],
  transforms: [] as Transform[],
  useBundlerMode: false
}

const webC: FastifyPluginAsync<Options> = async (fastify, options = {}) => {
  const config = Object.assign(defaults, options)

  const { components, logPrefix, templates, useBundlerMode } = config

  if (useBundlerMode) {
    throw new Error(
      `${logPrefix}WebC bundler mode is not supported at the moment`
    )
  }

  let helpers: Helpers = {}
  if (config.helpers.length > 0) {
    helpers = config.helpers.reduce((acc, cv) => {
      if (typeof cv === 'function') {
        return { ...acc, [cv.name]: { fn: cv, isScoped: false } }
      } else {
        const { fn, isScoped } = cv
        return { ...acc, [cv.name]: { fn, isScoped: isScoped || false } }
      }
    }, {} as Helpers)
  }

  let transforms: Transforms = {}
  if (config.transforms.length > 0) {
    transforms = config.transforms.reduce((acc, cv) => {
      if (typeof cv === 'function') {
        return { ...acc, [cv.name]: { fn: cv } }
      } else {
        return { ...acc, [cv.name]: { fn: cv.fn } }
      }
    }, {} as Transforms)
  }

  const render = defRender({
    components,
    helpers,
    logPrefix,
    templates,
    transforms,
    useBundlerMode
  })

  fastify.decorateReply('render', render)
  fastify.log.debug(`${logPrefix}decorated fastify.reply with render`)
}

export default fp(webC, {
  fastify: '5.x',
  name: 'fastify-webc'
  //   encapsulate: true
})
