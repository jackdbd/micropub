import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import type { ValidateFunction } from 'ajv'
import type { FastifyReply } from 'fastify'

import type {
  BaseStoreError,
  BaseStoreValue,
  Store
} from '../../../lib/micropub/index.js'
import { invalidRequest } from '../../../lib/micropub/error-responses.js'

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
        const error_description = `Received invalid JF2 according to schema ${schema_id}`
        this.request.log.warn(
          { jf2, errors: validate.errors || [] },
          `${PREFIX}${error_description}`
        )

        const { code, body } = invalidRequest({
          error_description,
          include_error_description
        })

        return this.errorResponse(code, body)
      } else {
        const message = `validated JF2 according to schema ${schema_id}`
        this.request.log.debug(`${PREFIX}${message}`)
      }
    }

    const result = await store.create(jf2)

    if (result.error) {
      const { code, body } = storeErrorToMicropubError(result.error, {
        include_error_description
      })
      this.request.log.error(`${PREFIX}${body.error}:${body.error_description}`)

      return this.errorResponse(code, body)
    } else {
      const { code, summary } = storeValueToMicropubValue(result.value)
      this.request.log.debug(`${PREFIX}${summary}`)

      const published_location = DEFAULT_PUBLISHED_LOCATION
      this.header('Location', published_location)

      return this.successResponse(code, {
        title: `Post h=${jf2.h} created`,
        summary,
        payload: { location: published_location }
      })
    }
  }
}
