import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest
} from 'fastify'
import Youch from 'youch'
import { APPLICATION_JSON, TEXT_HTML } from '../lib/content-type.js'
import {
  ForbiddenError,
  InsufficientScopeError,
  InvalidRequestError,
  InvalidScopeError,
  ServerError,
  UnauthorizedError
} from '../lib/fastify-errors/index.js'
import { clientAcceptsHtml } from '../lib/fastify-request-predicates/index.js'
import { throwIfDoesNotConform } from '../lib/validators.js'
import { DEFAULT } from './constants-dev.js'
import {
  options as options_schema,
  type Data,
  type Options
} from './schemas-dev.js'
import { statusCode } from './utils.js'

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

const defaults: Partial<Options> = {
  logPrefix: DEFAULT.LOG_PREFIX,
  postLines: DEFAULT.POST_LINES,
  preLines: DEFAULT.PRE_LINES,
  stackOverflowTag: DEFAULT.STACK_OVERFLOW_TAG,
  toggleShowAllFrames: DEFAULT.TOGGLE_SHOW_ALL_FRAMES
}

export const defErrorHandler = (options?: Options) => {
  // In development I want to see all AJV errors, so it makes no sense to accept
  // as a configuration parameter an instance of Ajv that might have
  // `allErrors: false`.
  const ajv = addFormats(new Ajv({ allErrors: true }), ['uri'])

  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const {
    logPrefix: prefix,
    postLines,
    preLines,
    // stackOverflowTag,
    toggleShowAllFrames
  } = config

  throwIfDoesNotConform({ prefix }, ajv, options_schema, config)

  return async function errorHandler(
    this: FastifyInstance,
    error:
      | ForbiddenError
      | UnauthorizedError
      | InsufficientScopeError
      | InvalidRequestError
      | InvalidScopeError
      | ServerError,
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const status_code = statusCode(error, request, reply)
    const message = `${prefix}${error.error}: ${error.error_description} (status: ${status_code}, error code: ${error.code})`

    if (status_code >= 500) {
      request.log.error(message)
    }

    // What to do with 4xx errors in DEVELOPMENT?
    // - Redirect to login?
    // - Receive a Telegram notification?
    // - Log a warning?
    // - Return and do nothing?
    if (status_code >= 400 && status_code < 500) {
      request.log.warn(message)
    }

    const youch = new Youch(error, request.raw, { preLines, postLines })

    const claims = request.session.get('claims')
    const jf2 = request.requestContext.get('jf2')

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

    if (toggleShowAllFrames) {
      // @ts-ignore-next-line
      youch.toggleShowAllFrames()
    }

    if (clientAcceptsHtml(request)) {
      try {
        const html = await youch.toHTML()
        return reply.code(status_code).type(TEXT_HTML).send(html)
      } catch (err) {
        return reply.code(status_code).send(err)
      }
    } else {
      const err = error as FastifyError
      return reply.code(status_code).type(APPLICATION_JSON).send({
        error: err.name,
        error_description: err.message,
        error_validation: err.validation,
        error_validationContext: err.validationContext,
        access_token_claims: claims,
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
  }
}

// const fastifyYouch: FastifyPluginCallback<PluginOptions> = (
//   fastify,
//   options,
//   done
// ) => {
//   done()
// }

// export default fp(fastifyYouch, {
//   // See here how to specify a semver range
//   // https://github.com/npm/node-semver#ranges
//   fastify: '>=4.0.0 <6.0.0',
//   name: NAME
// })
