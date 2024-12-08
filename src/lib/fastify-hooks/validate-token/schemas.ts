import type Ajv from 'ajv'
import { Static, Type } from '@sinclair/typebox'
import {
  include_error_description,
  report_all_ajv_errors
} from '../../schemas/flags.js'
import type { IsBlacklisted } from '../../schemas/is-blacklisted.js'

export const options = Type.Object({
  ajv: Type.Optional(Type.Any()),
  include_error_description: Type.Optional({
    ...include_error_description,
    default: false
  }),
  isBlacklisted: Type.Any(),
  key_in_session: Type.Optional(Type.String({ default: 'access_token' })),
  log_prefix: Type.Optional(Type.String({ default: '' })),
  report_all_ajv_errors: Type.Optional({
    ...report_all_ajv_errors,
    default: false
  })
})

export interface Options extends Static<typeof options> {
  ajv?: Ajv
  isBlacklisted: IsBlacklisted
}
