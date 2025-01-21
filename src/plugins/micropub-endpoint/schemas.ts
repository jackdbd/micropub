import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  me_before_url_canonicalization,
  me_after_url_canonicalization
} from '@jackdbd/indieauth'
import { media_endpoint, micropub_endpoint } from '../../lib/micropub/index.js'
import {
  ajv,
  create,
  deleteContentOrMedia,
  syndicate_to_item,
  report_all_ajv_errors,
  // undelete,
  update
} from '../../lib/schemas/index.js'
import type {
  Create,
  DeleteContentOrMedia,
  Undelete,
  Update
} from '../../lib/schemas/index.js'
import {
  isAccessTokenRevoked,
  type IsAccessTokenRevoked
} from '../../lib/storage-api/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object(
  {
    ajv: Type.Optional(ajv),

    create,

    delete: deleteContentOrMedia,

    includeErrorDescription: Type.Optional(
      Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
    ),

    isAccessTokenRevoked: isAccessTokenRevoked,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    me: Type.Union([
      me_before_url_canonicalization,
      me_after_url_canonicalization
    ]),

    mediaEndpoint: Type.Optional(media_endpoint),

    micropubEndpoint: Type.Optional(micropub_endpoint),

    multipartFormDataMaxFileSize: Type.Optional(
      Type.Number({
        title: 'multipart/form-data max file size',
        description: `Max file size (in bytes) for multipart/form-data requests.`,
        default: DEFAULT.MULTIPART_FORMDATA_MAX_FILE_SIZE,
        minimum: 0
      })
    ),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT.REPORT_ALL_AJV_ERRORS
    }),

    syndicateTo: Type.Optional(Type.Array(syndicate_to_item, { default: [] })),

    // undelete: Type.Optional(undelete),
    undelete: Type.Optional(Type.Any()),

    update
  },
  {
    $id: 'fastify-micropub-endpoint-options',
    title: 'Fastify plugin micropub-endpoint options',
    description: 'Options for the Fastify micropub-endpoint plugin'
  }
)

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  create: Create
  delete: DeleteContentOrMedia
  isAccessTokenRevoked: IsAccessTokenRevoked
  undelete?: Undelete
  update: Update
}
