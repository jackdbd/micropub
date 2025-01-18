import { Static, Type } from '@sinclair/typebox'

export const code_verifier_length = Type.Number({
  $id: 'pkce-code-verifier-length',
  description:
    'Length of the PKCE code verifier. See [Client Creates a Code Verifier](https://datatracker.ietf.org/doc/html/rfc7636#section-4.1).',
  minimum: 43,
  maximum: 128
})

export const code_verifier = Type.String({
  description:
    'PKCE code verifier. A high-entropy cryptographic random string. See [Client Creates a Code Verifier](https://datatracker.ietf.org/doc/html/rfc7636#section-4.1).',
  minLength: 43,
  maxLength: 128
})

export const code_challenge_method = Type.Union(
  [Type.Literal('plain'), Type.Literal('S256')],
  {
    $id: 'pkce-code-challenge-method',
    description:
      'The hashing method used to calculate the code challenge in the PKCE OAuth 2.0 flow. See [Client Creates the Code Challenge](https://datatracker.ietf.org/doc/html/rfc7636#section-4.2).',
    title: 'PKCE code challenge method'
  }
)

export type CodeChallengeMethod = Static<typeof code_challenge_method>

export const code_challenge = Type.String({
  $id: 'pkce-code-challenge',
  description:
    'The PKCE code challenge. See [Client Creates the Code Challenge](https://datatracker.ietf.org/doc/html/rfc7636#section-4.2).',
  minLength: 43,
  maxLength: 128,
  title: 'PKCE code challenge'
})
