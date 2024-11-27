import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import type { ValidateFunction } from 'ajv'
import type { FastifyReply } from 'fastify'
import { APPLICATION_JSON, TEXT_HTML } from '../../../lib/content-type.js'
import { clientAcceptsHtml } from '../../../lib/fastify-request-predicates/index.js'
import { INVALID_REQUEST } from '../../../lib/http-error.js'
import type {
  BaseStoreError,
  BaseStoreValue,
  ErrorResponseBody,
  Store
} from '../../../lib/micropub/index.js'
import { invalidRequest } from '../../../lib/micropub/error-responses.js'
import {
  deleteSuccessPage,
  undeleteSuccessPage,
  updateSuccessPage,
  successPage,
  type SuccessPageOptions
} from '../../../lib/micropub-html-responses/index.js'
import { NAME } from '../constants.js'
import {
  storeErrorToMicropubError,
  storeValueToMicropubValue
} from '../store-to-micropub.js'

const PREFIX = `${NAME}/decorators/reply `

// TODO: consider accepting a default published location as a parameter, then use
// the result of store.create() to overwrite it? Or maybe not set the Location
// header at all?
const DEFAULT_PUBLISHED_LOCATION = 'https://giacomodebidda.com/'

// TODO: add links to Micropub docs in HTML responses
// https://micropub.spec.indieweb.org/#error-response

export function micropubErrorResponse(
  this: FastifyReply,
  code: number,
  body: ErrorResponseBody
) {
  // Either passing base_url to the nunjucks template or not is fine. But if we
  // do pass it, we need to make sure to specify 'https' when we're not on
  // localhost, otherwise we will have mixed content errors.

  // const base_url =
  //   this.request.hostname === 'localhost'
  //     ? `http://${this.request.host}`
  //     : `https://${this.request.host}`

  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.view('error.njk', {
      error: body.error,
      error_description: body.error_description,
      description: 'Error page',
      title: `Error: ${body.error}`
    })
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send(body)
  }
}

export function micropubDeleteSuccessResponse(
  this: FastifyReply,
  summary?: string
) {
  // The typical status code for a successful DELETE request is 204, but if we
  // want to send a HTML page to the client we need to use 200 (or 202 if we
  // didn't actually deleted the file but we scheduled its deletion).
  this.code(200)
  const body = { summary }

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.send(deleteSuccessPage(body))
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send(body)
  }
}

export function micropubUndeleteSuccessResponse(
  this: FastifyReply,
  code: number,
  body: SuccessPageOptions
) {
  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.send(undeleteSuccessPage(body))
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send(body)
  }
}

export function micropubUpdateSuccessResponse(
  this: FastifyReply,
  code: number,
  body: SuccessPageOptions
) {
  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.send(updateSuccessPage(body))
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send(body)
  }
}

// TODO: add links to Micropub docs in HTML responses
// https://micropub.spec.indieweb.org/#error-response

export interface MicropubResponseConfig<
  StoreError extends BaseStoreError = BaseStoreError,
  StoreValue extends BaseStoreValue = BaseStoreValue
> {
  include_error_description: boolean
  store: Store<StoreError, StoreValue>
  validate?: ValidateFunction
}

export function defMicropubResponse<
  StoreError extends BaseStoreError = BaseStoreError,
  StoreValue extends BaseStoreValue = BaseStoreValue
>(config: MicropubResponseConfig<StoreError, StoreValue>) {
  const { include_error_description, store, validate } = config

  return async function micropubResponse(this: FastifyReply, jf2: Jf2) {
    // Either passing base_url to the nunjucks template or not is fine. But if we
    // do pass it, we need to make sure to specify 'https' when we're not on
    // localhost, otherwise we will have mixed content errors.

    // const base_url =
    //   this.request.hostname === 'localhost'
    //     ? `http://${this.request.host}`
    //     : `https://${this.request.host}`

    if (validate) {
      let schema_id = 'unknown (TIP: set $id and title in the schema)'
      if (typeof validate.schema === 'object') {
        if (validate.schema.$id) {
          schema_id = validate.schema.$id
        }
        if (validate.schema.title) {
          schema_id = `'${validate.schema.title}' (ID: ${validate.schema.$id})`
        }
      }
      this.request.log.debug(
        `${PREFIX}validate JF2 against schema ${schema_id}`
      )

      const valid = validate(jf2)

      if (!valid) {
        const error_description = `received invalid JF2 according to schema ${schema_id}`
        this.request.log.warn(
          { jf2, errors: validate.errors || [] },
          `${PREFIX}${error_description}`
        )

        const { code, body } = invalidRequest({
          error_description: INVALID_REQUEST.error,
          include_error_description
        })

        return this.micropubErrorResponse(code, body)
      } else {
        const message = `received valid JF2 according to schema ${schema_id}`
        this.request.log.debug(`${PREFIX}${message}`)
      }
    }

    const result = await store.create(jf2)

    if (result.error) {
      const { code, body } = storeErrorToMicropubError(result.error)
      this.request.log.error(`${PREFIX}${body.error}:${body.error_description}`)

      const payload = include_error_description ? body : { error: body.error }

      this.code(code)

      if (clientAcceptsHtml(this.request)) {
        this.header('Content-Type', TEXT_HTML)
        return this.view('error.njk', {
          error: body.error,
          error_description: body.error_description,
          description: 'Error page',
          title: `Error: ${body.error}`,
          payload
        })
      } else {
        this.header('Content-Type', APPLICATION_JSON)
        return this.send(payload)
      }
    } else {
      const { code, summary } = storeValueToMicropubValue(result.value)
      this.request.log.debug(`${PREFIX}${summary}`)

      console.log('=== TODO: syndicate ===')
      // const messages = await syndicate(jf2)

      const published_location = DEFAULT_PUBLISHED_LOCATION

      // assert status code 201?
      this.code(code)
      this.header('Location', published_location)

      const title = `Post of type '${jf2.type}' created`
      if (clientAcceptsHtml(this.request)) {
        this.header('Content-Type', TEXT_HTML)
        return this.send(successPage({ summary, title }))
      } else {
        this.header('Content-Type', APPLICATION_JSON)
        return this.send({ summary, title })
      }
    }
  }
}
