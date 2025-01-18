import { Static, Type } from '@sinclair/typebox'
import { issued_info } from './issued-info.js'

/**
 * Handler invoked when the token endpoint has issued an access token and a
 * refresh token. You should use it to persist the tokens to storage.
 */
export const onIssuedTokens = Type.Function(
  [issued_info],
  Type.Promise(Type.Void()),
  {
    $id: 'on-issued-tokens',
    title: 'onIssuedTokens',
    description: `Handler invoked when the token endpoint has issued an access token and a refresh token. You should use it to persist the tokens to storage.`
  }
)

export type OnIssuedTokens = Static<typeof onIssuedTokens>
