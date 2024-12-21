import { Static, Type } from '@sinclair/typebox'
import { me } from '../../lib/indieauth/index.js'
import { media_endpoint, micropub_endpoint } from '../../lib/micropub/index.js'
import {
  create,
  deleteContentOrMedia,
  isBlacklisted,
  report_all_ajv_errors,
  syndicate_to_item,
  undelete,
  update
} from '../../lib/schemas/index.js'
import type {
  Create,
  DeleteContentOrMedia,
  IsBlacklisted,
  Undelete,
  Update
} from '../../lib/schemas/index.js'
import {
  DEFAULT_INCLUDE_ERROR_DESCRIPTION,
  DEFAULT_LOG_PREFIX,
  DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
  DEFAULT_REPORT_ALL_AJV_ERRORS
} from './constants.js'

export const options = Type.Object(
  {
    create,

    delete: deleteContentOrMedia,

    includeErrorDescription: Type.Optional(
      Type.Boolean({ default: DEFAULT_INCLUDE_ERROR_DESCRIPTION })
    ),

    isBlacklisted,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT_LOG_PREFIX })),

    me,

    mediaEndpoint: Type.Optional(media_endpoint),

    micropubEndpoint: Type.Optional(micropub_endpoint),

    multipartFormDataMaxFileSize: Type.Optional(
      Type.Number({
        title: 'multipart/form-data max file size',
        description: `Max file size (in bytes) for multipart/form-data requests.`,
        default: DEFAULT_MULTIPART_FORMDATA_MAX_FILE_SIZE,
        minimum: 0
      })
    ),

    reportAllAjvErrors: Type.Optional({
      ...report_all_ajv_errors,
      default: DEFAULT_REPORT_ALL_AJV_ERRORS
    }),

    syndicateTo: Type.Optional(Type.Array(syndicate_to_item, { default: [] })),

    undelete: Type.Optional(undelete),

    update
  },
  {
    $id: 'fastify-micropub-endpoint-options',
    title: 'Fastify plugin micropub-endpoint options',
    description: 'Options for the Fastify micropub-endpoint plugin'
  }
)

export interface Options extends Static<typeof options> {
  create: Create
  delete: DeleteContentOrMedia
  isBlacklisted: IsBlacklisted
  undelete?: Undelete
  update: Update
}
