import {
  FastifyInstance,
  //   FastifyPluginOptions,
  DoneFuncWithErrOrRes
} from 'fastify'
import fp from 'fastify-plugin'
import Youch from 'youch'
import { applyToDefaults } from '@hapi/hoek'

const EMOJI = '🔍'
const NAME = 'fastify-youch'
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

export interface PluginOptions extends YouchOptions {
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
  file: string
  filePath: string
  line: number
  callee: string
  calleeShort: string
  column: number
  context: Object
  isModule: boolean
  isNative: boolean
  isApp: boolean
  classes: string
}

export interface Data {
  message: string
  help: any
  cause: any
  name: string
  status: any
  frames: Frame[]
}

/**
 * Renders an anchor tag to quickly search the error on the given site.
 *
 * fab: Font Awesome brand icons
 * https://fontawesome.com/icons?d=gallery&s=brands&m=free
 * Google Search Operators
 * https://support.google.com/websearch/answer/2466433?hl=en
 * https://moz.com/learn/seo/search-operators
 * https://ahrefs.com/blog/google-advanced-search-operators/
 */
const anchor = ({
  data,
  site,
  style,
  fa_icon
}: {
  data: Data
  site: string
  style: string
  fa_icon: string
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

const fastifyYouch = (
  fastify: FastifyInstance,
  opts: PluginOptions,
  done: DoneFuncWithErrOrRes
) => {
  const config = applyToDefaults(defaultOptions, opts)
  fastify.log.debug(`${PREFIX} config ${JSON.stringify(config, null, 2)}`)

  fastify.setErrorHandler(function (error, request, reply) {
    const youch = new Youch(error, request.raw, {
      preLines: config.preLines,
      postLines: config.postLines
    })

    const sharedStyle = `vertical-align: middle; margin-right: 0.25rem; color: var(--primary-color);`
    const redditStyle = `--primary-color: #FF5700;`
    const githubStyle = `--primary-color: #24292f;`
    const stackOverflowStyle = `--primary-color: rgb(244, 128, 36);`

    youch.addLink((data: Data) => {
      return anchor({
        data,
        fa_icon: 'fa-stack-overflow',
        site: 'stackoverflow.com',
        style: `${stackOverflowStyle} ${sharedStyle}`
      })
    })

    youch.addLink((data: Data) => {
      return anchor({
        data,
        fa_icon: 'fa-reddit',
        site: 'reddit.com',
        style: `${redditStyle} ${sharedStyle}`
      })
    })

    youch.addLink((data: Data) => {
      return anchor({
        data,
        fa_icon: 'fa-github',
        site: 'github.com',
        style: `${githubStyle} ${sharedStyle}`
      })
    })

    if (config.toggleShowAllFrames) {
      // @ts-ignore
      youch.toggleShowAllFrames()
    }

    const is_json = request.headers.accept === 'application/json' || false
    const status = error.statusCode || request.raw.statusCode || 500

    if (is_json) {
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
    } else {
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
    }
  })

  fastify.log.debug({
    message: `${PREFIX} registered`,
    severity: 'DEBUG'
  })
  done()
}

export default fp(fastifyYouch, {
  fastify: '^4.x.x',
  name: NAME
})
