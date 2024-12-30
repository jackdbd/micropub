import { Static, Type } from '@sinclair/typebox'
import {
  include_error_description,
  include_error_details
} from '../lib/schemas/index.js'
import { DEFAULT } from './constants-prod.js'
import { telegram } from './schemas-shared.js'

export const options = Type.Object({
  includeErrorDescription: Type.Optional({
    ...include_error_description,
    default: DEFAULT.INCLUDE_ERROR_DESCRIPTION
  }),

  includeErrorDetails: Type.Optional({
    ...include_error_details,
    default: DEFAULT.INCLUDE_ERROR_DETAILS
  }),

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  redirectUrl: Type.Optional(Type.String({ default: DEFAULT.REDIRECT_URL })),

  telegram: Type.Optional(telegram)
})

export type Options = Static<typeof options>
