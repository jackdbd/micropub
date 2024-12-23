import { Static, Type } from '@sinclair/typebox'
import { DEFAULT } from './constants-prod.js'
import { telegram } from './schemas-shared.js'

// https://micropub.spec.indieweb.org/#error-response
const DESCRIPTION_INCLUDE_ERROR_DESCRIPTION = `Whether to include an
\`error_description\` property in all error responses.
This is meant to assist the client developer in understanding the error.
This is NOT meant to be shown to the end user.`
// I may include additional details about the error, not just error_description.

export const include_error_description = Type.Boolean({
  description: DESCRIPTION_INCLUDE_ERROR_DESCRIPTION
})

export const include_error_details = Type.Boolean({
  description: `Whether to include additional details in all error responses.`
})

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
