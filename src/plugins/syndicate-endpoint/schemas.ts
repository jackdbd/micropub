import { Static, Type } from '@sinclair/typebox'
import type Ajv from 'ajv'
import {
  me_before_url_canonicalization,
  me_after_url_canonicalization
} from '@jackdbd/indieauth'
import { retrieveContent, update } from '@jackdbd/fastify-micropub-endpoint'
import type {
  RetrieveContent,
  Update
} from '@jackdbd/fastify-micropub-endpoint'
import { isAccessTokenRevoked } from '@jackdbd/fastify-revocation-endpoint'
import type { IsAccessTokenRevoked } from '@jackdbd/fastify-revocation-endpoint'
import {
  ajv,
  report_all_ajv_errors,
  websiteUrlToStoreLocation
} from '../../lib/schemas/index.js'
import type { WebsiteUrlToStoreLocation } from '../../lib/schemas/index.js'
import { DEFAULT } from './constants.js'

// import type { Syndicator } from '../../lib/micropub/index.js'
// syndicators: { [uid: string]: Syndicator }

export const options = Type.Object({
  ajv: Type.Optional(ajv),

  get: retrieveContent,

  includeErrorDescription: Type.Optional(
    Type.Boolean({ default: DEFAULT.INCLUDE_ERROR_DESCRIPTION })
  ),

  isAccessTokenRevoked,

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  me: Type.Union([
    me_before_url_canonicalization,
    me_after_url_canonicalization
  ]),

  publishedUrlToStorageLocation: websiteUrlToStoreLocation,

  reportAllAjvErrors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT.REPORT_ALL_AJV_ERRORS
  }),

  syndicators: Type.Any(),

  update
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  get: RetrieveContent
  isAccessTokenRevoked: IsAccessTokenRevoked
  publishedUrlToStorageLocation: WebsiteUrlToStoreLocation
  update: Update
}
