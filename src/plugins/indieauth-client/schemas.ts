import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { report_all_ajv_errors } from '../../lib/schemas/index.js'
import {
  client_id,
  client_name,
  client_uri,
  logo_uri,
  redirect_uris
} from '../../lib/indieauth/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object(
  {
    ajv: Type.Optional(Type.Any()),

    /**
     * IndieAuth client identifier. It MUST be a URL.
     *
     * @see [Client Identifier - IndieAuth](https://indieauth.spec.indieweb.org/#client-identifier)
     */
    clientId: client_id,

    clientName: client_name,

    clientUri: client_uri,

    logoUri: Type.Optional({ ...logo_uri, default: DEFAULT.LOGO_URI }),

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    redirectUris: redirect_uris,

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    })
  },
  {
    $id: 'fastify-indieauth-client-options',
    description: 'Options for the Fastify indieauth-client plugin',
    title: 'Fastify plugin indieauth-client options'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
}
