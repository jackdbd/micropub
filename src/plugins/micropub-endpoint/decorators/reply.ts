import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import type { ValidateFunction } from 'ajv'
import type { FastifyReply } from 'fastify'
import { InvalidRequestError } from '../../../lib/fastify-errors/index.js'
import type { Create } from '../../../lib/schemas/index.js'
import {
  storeErrorToMicropubError,
  storeValueToMicropubValue
} from '../store-to-micropub.js'

// TODO: consider accepting a default published location as a parameter, then use
// the result of store.create() to overwrite it? Or maybe not set the Location
// header at all?
const DEFAULT_PUBLISHED_LOCATION = 'https://giacomodebidda.com/'

export interface ResponseConfig {
  validate: ValidateFunction
}

export interface MicropubResponseConfig {
  create: Create
  include_error_description: boolean
  prefix: string
}

export function defMicropubResponse(config: MicropubResponseConfig) {
  const { create, include_error_description, prefix } = config

  return async function micropubResponse(
    this: FastifyReply,
    jf2: Jf2,
    cfg: ResponseConfig
  ) {
    const { validate } = cfg
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

      const valid = validate(jf2)

      if (!valid) {
        const error_description = `Received invalid JF2 according to schema '${schema_id}'.`
        this.request.log.warn(
          { jf2, errors: validate.errors || [] },
          `${prefix}${error_description}`
        )
        const err = new InvalidRequestError({ error_description })
        return this.code(err.statusCode).send(
          err.payload({ include_error_description })
        )
      } else {
        const message = `validated JF2 according to schema ${schema_id}`
        this.request.log.debug(`${prefix}${message}`)
      }
    }

    const result = await create(jf2)

    if (result.error) {
      const err = storeErrorToMicropubError(result.error)
      this.request.log.error(
        `${prefix}${err.error} (${err.statusCode}): ${err.error_description}`
      )

      return this.code(err.statusCode).send(
        err.payload({ include_error_description })
      )
    } else {
      const { code, summary } = storeValueToMicropubValue(result.value)
      this.request.log.debug(`${prefix}${summary}`)

      const published_location = DEFAULT_PUBLISHED_LOCATION
      this.header('Location', published_location)

      return this.code(code).send({ location: published_location })
    }
  }
}
