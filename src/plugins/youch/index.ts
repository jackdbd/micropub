import { requestContext } from '@fastify/request-context'
import { applyToDefaults } from '@hapi/hoek'
import type { FastifyPluginOptions, FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import Youch from 'youch'
import { APPLICATION_JSON, TEXT_HTML } from '../../lib/content-type.js'
import { clientAcceptsHtml } from '../../lib/fastify-request-predicates/index.js'

const NAME = '@jackdbd/fastify-youch'

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

  fastify.setErrorHandler(function (error, request, reply) {
    const youch = new Youch(error, request.raw, {
      preLines: config.preLines,
      postLines: config.postLines
    })

    const access_token_claims = requestContext.get('access_token_claims')
    const jf2 = requestContext.get('jf2')

    // Maybe allow to customise this CSS with as an option for this plugin.
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

    // TODO: add link to send the error to ChatGPT, GitHub Copilot, etc.
    for (const m of xs) {
      youch.addLink((data: Data) => {
        return anchor({ ...m, data })
      })
    }

    if (config.toggleShowAllFrames) {
      // @ts-ignore-next-line
      youch.toggleShowAllFrames()
    }

    const status = error.statusCode || request.raw.statusCode || 500

    if (clientAcceptsHtml(request)) {
      return youch
        .toHTML()
        .then((html) => {
          reply.code(status).type(TEXT_HTML).send(html)
        })
        .catch((err) => {
          reply.code(status).send(err)
        })
    } else {
      return reply.code(status).type(APPLICATION_JSON).send({
        error: error.name,
        error_description: error.message,
        error_validation: error.validation,
        error_validationContext: error.validationContext,
        access_token_claims,
        jf2
      })
      // Uncomment this if you want to see the stack trace. It might be useful
      // to see the stack trace in graphical API clients like Postman or Bruno.
      // youch
      //   .toJSON()
      //   .then((json) => {
      //     reply.code(status).type('application/json; charset=utf-8').send(json)
      //   })
      //   .catch((err) => {
      //     reply.code(status).send(err)
      //   })
    }
  })

  done()
}

export default fp(fastifyYouch, {
  // See here how to specify a semver range
  // https://github.com/npm/node-semver#ranges
  fastify: '>=4.0.0 <6.0.0',
  name: NAME
})
