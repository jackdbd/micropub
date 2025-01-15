import { Static, Type } from '@sinclair/typebox'
import { issued_info } from '../../../lib/issue-tokens/index.js'

const description = `Handler invoked when the token endpoint has issued an 
access token and a refresh token. You should use it to persist the tokens to 
storage.`

const title = 'onIssuedTokens'

const onIssuedTokens_ = Type.Function(
  [issued_info],
  Type.Promise(Type.Void()),
  { description, title }
)

export type OnIssuedTokens = Static<typeof onIssuedTokens_>

export const onIssuedTokens = Type.Any({ description, title })
