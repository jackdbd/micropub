import fs from 'node:fs'
import path from 'node:path'
import type { Readable } from 'node:stream'
import { WebC } from '@11ty/webc'
import type { TransformCallback } from '@11ty/webc'
import type { FastifyReply } from 'fastify'

export type Helpers = Record<string, { fn: Function; isScoped?: boolean }>
export type Transforms = Record<string, { fn: TransformCallback }>

interface Config {
  components: string | string[] | Record<string, string>
  helpers: Helpers
  logPrefix: string
  templates: string[]
  transforms: Transforms
  useBundlerMode: boolean
}

export const defRender = (config: Config) => {
  const {
    components,
    helpers,
    logPrefix,
    templates,
    transforms,
    useBundlerMode
  } = config
  return async function viewWebC(
    this: FastifyReply,
    pageName: string,
    data: Record<string, any>
  ) {
    let file: string | undefined
    for (const dir of templates) {
      const pagePath = path.join(dir, pageName)
      if (fs.existsSync(pagePath)) {
        file = pagePath
        break
      }
    }

    if (!file) {
      throw new Error(`template ${pageName} not found in ${templates}`)
    }

    // It seems I cannot reuse a single WebC instance across pages. Every page
    // needs its own WebC instance.
    // That's how eleventy-plugin-webc does it in this Eleventy transform.
    // https://github.com/11ty/eleventy-plugin-webc/blob/b5d39d55b330990280a9fea34dbf4fcd3d3d25a6/src/eleventyWebcTransform.js#L20
    // That's also how this koa middleware does it.
    // https://github.com/sombriks/koa-webc/blob/main/src/main.js
    const page = new WebC({ file })

    page.defineComponents(components)

    if (useBundlerMode) {
      page.setBundlerMode(true)
    }

    Object.entries(helpers).forEach(([key, { fn, isScoped }]) => {
      page.setHelper(key, fn, isScoped)
      this.log.debug(`${logPrefix}added helper '${key}' (scoped: ${isScoped})`)
    })

    Object.entries(transforms).forEach(([key, { fn }]) => {
      page.setTransform(key, fn)
      this.log.debug(`${logPrefix}added transform '${key}'`)
    })

    // const m = WebC.getComponentsMap(['**/*.webc'])
    // console.log('=== ComponentsMap ===', m)

    // this.log.debug(`${logPrefix}compiling ${file}`)
    // const { html, css, js } = await page.compile({ data })

    // const mode = page.getRenderingMode(html)
    // this.log.debug(`rendering mode: ${mode}`)

    this.log.debug(`${logPrefix}streaming ${file}`)
    const { html } = await page.stream({ data })

    // Fastify supports sending Node.js Readable streams as responses. So we can
    // just call reply.send(string | Readable stream)
    let payload: string | Readable
    if (page.bundlerMode) {
      payload = html
    } else {
      payload = html
    }

    this.header('Content-Type', 'text/html; charset=utf-8')
    return this.code(200).send(payload)
  }
}
