import { Static, Type } from '@sinclair/typebox'
import { report_all_ajv_errors } from '../../schemas/index.js'
import {
  DEFAULT_HEADER,
  DEFAULT_HEADER_KEY,
  DEFAULT_LOG_PREFIX,
  DEFAULT_REPORT_ALL_AJV_ERRORS,
  DEFAULT_SESSION_KEY
} from './constants.js'

export const options = Type.Object({
  header: Type.Optional(Type.String({ minLength: 1, default: DEFAULT_HEADER })),
  header_key: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT_HEADER_KEY })
  ),
  log_prefix: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT_LOG_PREFIX })
  ),
  report_all_ajv_errors: Type.Optional({
    ...report_all_ajv_errors,
    default: DEFAULT_REPORT_ALL_AJV_ERRORS
  }),
  session_key: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT_SESSION_KEY })
  )
})

export type Options = Static<typeof options>
