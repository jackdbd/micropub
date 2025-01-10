import { authorization_code_props } from './lib/authorization-code-storage-interface/index.js'
import { client_application_props } from './lib/clients-storage-interface/index.js'
import { user_profile_props } from './lib/profile-storage-interface/index.js'
import {
  access_token_props,
  refresh_token_props
} from './lib/token-storage-interface/index.js'
import type { HashMapSchemas } from './constants.js'

export const PROPS_SCHEMAS: HashMapSchemas = {
  access_token: access_token_props,
  authorization_code: authorization_code_props,
  client_application: client_application_props,
  refresh_token: refresh_token_props,
  user_profile: user_profile_props
}
