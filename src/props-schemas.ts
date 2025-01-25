import { authorization_code_props } from '@jackdbd/fastify-authorization-endpoint'
import {
  access_token_props,
  refresh_token_props
} from '@jackdbd/fastify-token-endpoint'
import { user_profile_props } from '@jackdbd/fastify-userinfo-endpoint'
import { client_application_props } from './lib/clients-storage-interface/index.js'
import type { HashMapSchemas } from './constants.js'

export const PROPS_SCHEMAS: HashMapSchemas = {
  access_token: access_token_props,
  authorization_code: authorization_code_props,
  client_application: client_application_props,
  refresh_token: refresh_token_props,
  user_profile: user_profile_props
}
