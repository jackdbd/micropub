import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import { me } from '../../lib/indieauth/index.js'
import { media_endpoint, micropub_endpoint } from '../../lib/micropub/index.js'
import {
  create,
  type Create,
  deleteContentOrMedia,
  type DeleteContentOrMedia,
  isBlacklisted,
  type IsBlacklisted,
  syndicate_to_item,
  report_all_ajv_errors,
  undelete,
  type Undelete,
  update,
  type Update
} from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

export const options = Type.Object(
  {
    ajv: Type.Optional(Type.Any()),

    create,

    delete: deleteContentOrMedia,

    isBlacklisted,

    logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

    me,

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
  ajv?: Ajv
  create: Create
  delete: DeleteContentOrMedia
  isBlacklisted: IsBlacklisted
  undelete?: Undelete
  update: Update
}
