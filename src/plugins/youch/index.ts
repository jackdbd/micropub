import type { FastifyPluginOptions, FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import Youch from 'youch'
import { applyToDefaults } from '@hapi/hoek'

const EMOJI = '🔍'
const NAME = '@jackdbd/fastify-youch'
const PREFIX = `[${EMOJI} ${NAME}]`

export interface YouchOptions {
  /**
   * Number of lines to be displayed above the error in the stack trace.
   */
  preLines?: number

  /**
   * Number of lines to be displayed below the error in the stack trace.
   */
  postLines?: number
}

export interface PluginOptions extends YouchOptions, FastifyPluginOptions {
  stackOverflowTag?: string
  toggleShowAllFrames?: boolean
}

const defaultOptions: PluginOptions = {
  preLines: 5,
  postLines: 5,
  stackOverflowTag: 'fastify',
  toggleShowAllFrames: true
}

export interface Frame {
  callee: string
  calleeShort: string
  classes: string
  column: number
  context: Object
  file: string
  filePath: string
  isApp: boolean
  isModule: boolean
  isNative: boolean
  line: number
}

export interface Data {
  cause: any
  frames: Frame[]
  help: any
  message: string
  name: string
  status: any
}

/**
 * Renders an anchor tag to quickly search the error on the given site.
 *
 * - fab: [Font Awesome brand icons](https://fontawesome.com/icons?d=gallery&s=brands&m=free)
 * - Google Search Operators:
 *   - https://support.google.com/websearch/answer/2466433?hl=en
 *   - https://moz.com/learn/seo/search-operators
 *   - https://ahrefs.com/blog/google-advanced-search-operators/
 */
const anchor = ({
  data,
  fa_icon,
  site,
  style
}: {
  data: Data
  fa_icon: string
  site: string
  style: string
}) => {
  const message = data.message

  const url = `https://www.google.com/search?q=${encodeURIComponent(
    `${message} site:${site}`
  )}`

  return `
    <a href="${url}" target="_blank" title="Search error on ${site}">
      <i class="fab ${fa_icon}" aria-hidden="true" style="${style}"></i>
      ${message}
    </a>`
}

const fastifyYouch: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaultOptions, options)
  fastify.log.debug(`${PREFIX} config ${JSON.stringify(config, null, 2)}`)

  fastify.setErrorHandler(function (error, request, reply) {
    const youch = new Youch(error, request.raw, {
      preLines: config.preLines,
      postLines: config.postLines
    })

    // Maybe allow to customise these as plugin options
    const sharedStyle = `vertical-align: middle; margin-right: 0.25rem; color: var(--primary-color);`
    const redditStyle = `--primary-color: #FF5700;`
    const githubStyle = `--primary-color: #24292f;`
    const stackOverflowStyle = `--primary-color: rgb(244, 128, 36);`

    const xs = [
      {
        fa_icon: 'fa-stack-overflow',
        site: 'stackoverflow.com',
        style: `${stackOverflowStyle} ${sharedStyle}`
      },
      {
        fa_icon: 'fa-reddit',
        site: 'reddit.com',
        style: `${redditStyle} ${sharedStyle}`
      },
      {
        fa_icon: 'fa-github',
        site: 'github.com',
        style: `${githubStyle} ${sharedStyle}`
      }
    ]

    // TODO: add optional call to ChatGPT API, GitHub Copilot, etc.
    for (const m of xs) {
      youch.addLink((data: Data) => {
        return anchor({ ...m, data })
      })
    }

    if (config.toggleShowAllFrames) {
      // @ts-ignore
      youch.toggleShowAllFrames()
    }

    const status = error.statusCode || request.raw.statusCode || 500

    const client_accepts_html =
      request.headers.accept && request.headers.accept.includes('text/html')

    if (client_accepts_html) {
      youch
        .toHTML()
        .then((html) => {
          reply.code(status)
          reply.type('text/html')
          reply.send(html)
        })
        .catch((err) => {
          reply.code(status)
          reply.send(err)
        })
    } else {
      youch
        .toJSON()
        .then((json) => {
          reply.code(status)
          reply.type('application/json')
          reply.send(json)
        })
        .catch((err) => {
          reply.code(status)
          reply.send(err)
        })
    }
  })

  fastify.log.debug({
    message: `${PREFIX} registered`,
    severity: 'DEBUG'
  })
  done()
}

export default fp(fastifyYouch, {
  // See here how to specify a semver range
  // https://github.com/npm/node-semver#ranges
  fastify: '>=4.0.0 <6.0.0',
  name: NAME
})
