import { applyToDefaults } from '@hapi/hoek'
import { send } from '@jackdbd/notifications/telegram'
import { errorText } from '@jackdbd/telegram-text-messages/error'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest
} from 'fastify'
import {
  ForbiddenError,
  InsufficientScopeError,
  InvalidRequestError,
  InvalidScopeError,
  ServerError,
  UnauthorizedError
} from '../lib/fastify-error-response/index.js'
import { clientAcceptsHtml } from '../lib/fastify-request-predicates/index.js'
import { throwIfDoesNotConform } from '../lib/validators.js'
import { DEFAULT } from './constants-prod.js'
import { options as options_schema, type Options } from './schemas-prod.js'
import { statusCode } from './utils.js'

const defaults: Partial<Options> = {
  includeErrorDescription: DEFAULT.INCLUDE_ERROR_DESCRIPTION,
  includeErrorDetails: DEFAULT.INCLUDE_ERROR_DETAILS,
  logPrefix: DEFAULT.LOG_PREFIX,
  redirectUrl: DEFAULT.REDIRECT_URL
}

export const defErrorHandler = (options?: Options) => {
  // In production I don't want to expose too much information regarding
  // validation errors, so it makes no sense to accept as a configuration
  // parameter an instance of Ajv that might have `allErrors: true`.
  // https://ajv.js.org/security.html#security-risks-of-trusted-schemas
  const ajv = addFormats(new Ajv({ allErrors: false }), ['uri'])

  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const {
    includeErrorDescription,
    includeErrorDetails,
    logPrefix: prefix,
    redirectUrl
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

    // What to do with 4xx errors in PRODUCTION?
    // - Redirect to login?
    // - Receive a Telegram notification?
    // - Log a warning?
    // - Return and do nothing?
    if (status_code >= 400 && status_code < 500) {
      request.log.warn(message)
      // return // uncomment if you want to handle 4xx errors
    }

    const claims = request.session.get('claims')
    const jf2 = request.requestContext.get('jf2')

    const error_title = error.name || 'Error'

    const err = error as FastifyError

    let payload: { [key: string]: any } = { error: error.error }

    if (includeErrorDescription) {
      payload = {
        ...payload,
        error_description: error.error_description,
        error_uri: error.error_uri,
        state: error.state
      }
    }

    if (includeErrorDetails) {
      payload = {
        ...payload,
        error_details: {
          access_token_claims: claims,
          error_validation: err.validation,
          error_validationContext: err.validationContext,
          jf2,
          request_host: request.host,
          request_method: request.method,
          request_url: request.url
        }
      }
    }

    if (config.telegram) {
      const text = errorText({
        app_name: 'Micropub',
        app_version: '0.0.1',
        error_message: JSON.stringify(payload, null, 2),
        error_title,
        links: [
          {
            href: 'https://fly.io/apps/micropub/monitoring',
            text: 'Fly Live logs'
          }
        ]
      })

      const { chat_id, token } = config.telegram

      const result = await send(
        { chat_id, token, text },
        { disable_notification: false, disable_web_page_preview: true }
      )

      if (result.delivered) {
        request.log.debug(`${prefix}result.message`)
      } else {
        request.log.warn(`${prefix}result.message`)
      }
    }

    // Give the user the option to customize the error page and/or the redirect?
    if (clientAcceptsHtml(request)) {
      if (status_code === 401 || status_code === 403) {
        return reply.redirect(redirectUrl, 302)
      }

      // return reply.view('error.njk', {
      //   title: error.name,
      //   description: `Error '${error.name}' (code: ${error.code})`,
      //   error: payload.error,
      //   error_description: payload.error_description,
      //   error_uri: payload.error_uri,
      //   state: payload.state,
      //   error_details: payload.error_details
      // })
    }

    return reply.code(status_code).send(payload)
  }
}
