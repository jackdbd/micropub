import { Type } from '@sinclair/typebox'

export const ajv = Type.Any({ description: 'Instance of Ajv' })

export {
  include_error_description,
  include_error_details,
  report_all_ajv_errors
} from './flags.js'

export { info, type Info } from './info.js'

export { storage, type Introspection } from './introspection.js'
