import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { clientAcceptsHtml } from '../lib/fastify-request-predicates/index.js'
import { throwIfDoesNotConform } from '../lib/validators.js'
import { options as options_schema, type Options } from './schemas.js'
import { DEFAULT } from './constants.js'

const defaults: Partial<Options> = {
  goBackHref: DEFAULT.GO_BACK_HREF,
  goBackName: DEFAULT.GO_BACK_NAME,
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

export const defNotFoundHandler = (options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const {
    goBackHref: go_back_href,
    goBackName: go_back_name,
    logPrefix: log_prefix,
    reportAllAjvErrors: report_all_ajv_errors
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  return function notFoundHandler(
    this: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    request.log.debug(
      { host: request.host, routeOptions: request.routeOptions },
      `${log_prefix} request URL: ${request.url}`
    )

    if (clientAcceptsHtml(request)) {
      return reply.code(404).view('404.njk', {
        title: 'Not Found',
        description: `URL ${request.url} not found.`,
        go_back_href,
        go_back_name,
        request_url: request.url
      })
    } else {
      return reply.code(404).send({ message: 'Not Found' })
    }
  }
}
