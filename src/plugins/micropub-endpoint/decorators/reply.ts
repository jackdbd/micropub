import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import type { ValidateFunction } from 'ajv'
import type { FastifyReply } from 'fastify'
import { APPLICATION_JSON, TEXT_HTML } from '../../../lib/content-type.js'
import { clientAcceptsHtml } from '../../../lib/fastify-request-predicates/index.js'
import { INVALID_REQUEST } from '../../../lib/http-error.js'
import type {
  BaseStoreError,
  BaseStoreValue,
  ClientErrorResponseBody,
  ClientErrorStatusCode,
  Store
} from '../../../lib/micropub/index.js'
import {
  errorPage,
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
  code: ClientErrorStatusCode,
  body: ClientErrorResponseBody
) {
  const base_url = `${this.request.protocol}://${this.request.host}`

  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.send(errorPage({ ...body, base_url }))
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send(body)
  }
}

export function micropubDeleteSuccessResponse(
  this: FastifyReply,
  code: number,
  body: SuccessPageOptions
) {
  const base_url = `${this.request.protocol}://${this.request.host}`
  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.send(deleteSuccessPage({ ...body, base_url }))
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
  const base_url = `${this.request.protocol}://${this.request.host}`

  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.send(undeleteSuccessPage({ ...body, base_url }))
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
  const base_url = `${this.request.protocol}://${this.request.host}`

  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.send(updateSuccessPage({ ...body, base_url }))
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
    const base_url = `${this.request.protocol}://${this.request.host}`

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

        return this.micropubErrorResponse(INVALID_REQUEST.code, {
          error: INVALID_REQUEST.error,
          error_description
        })
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
        return this.send(errorPage({ ...payload, base_url }))
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
        return this.send(successPage({ base_url, summary, title }))
      } else {
        this.header('Content-Type', APPLICATION_JSON)
        return this.send({ summary, title })
      }
    }
  }
}
