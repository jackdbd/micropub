import { Static, Type } from '@sinclair/typebox'
import { client_id } from '../../../lib/indieauth/index.js'
import {
  authorization_endpoint,
  grant_type,
  redirect_uri
} from '../../../lib/oauth2/index.js'
import { code_challenge, code_verifier } from '../../../lib/pkce/index.js'
import { issueJWT, type IssueJWT } from '../../../lib/schemas/index.js'

export const token_post_request_body = Type.Object({
  client_id,
  code: code_challenge,
  code_verifier,
  grant_type: { ...grant_type, default: 'authorization_code' },
  redirect_uri
})

export type TokenPostRequestBody = Static<typeof token_post_request_body>

export const token_post_config = Type.Object({
  authorization_endpoint,
  issueJWT,
  log_prefix: Type.String()
})

export interface TokenPostConfig extends Static<typeof token_post_config> {
  issueJWT: IssueJWT
}
