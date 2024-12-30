import { Type } from '@sinclair/typebox'

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

export const report_all_ajv_errors = Type.Boolean({
  description: 'Whether to report all AJV validation errors.',
  title: 'report all AJV errors'
})
