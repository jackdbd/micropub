import { Type } from '@sinclair/typebox'

const DESCRIPTION_INCLUDE_ERROR_DESCRIPTION = `Whether to include an
\`error_description\` property in all JSON error responses.
This is meant to assist the client developer in understanding the error.
This is NOT meant to be shown to the end user.`

export const include_error_description = Type.Boolean({
  description: DESCRIPTION_INCLUDE_ERROR_DESCRIPTION,
  title: 'include error_description'
})

export const report_all_ajv_errors = Type.Boolean({
  description: 'Whether to report all AJV validation errors.',
  title: 'report all AJV errors'
})
