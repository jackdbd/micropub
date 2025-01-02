import crypto from 'node:crypto'
import {
  authorizationRequestUrl,
  metadataEndpoint,
  serverMetadata
} from '../src/lib/indieauth/index.js'

const run = async () => {
  const args = process.argv.slice(2)
  let [_me_flag, me, ...rest] = args

  if (!me) {
    me = 'https://giacomodebidda.com/'
  }

  const { value: metadata_endpoint } = await metadataEndpoint(me)

  if (!metadata_endpoint) {
    process.exit(1)
  }

  const { value: metadata } = await serverMetadata(metadata_endpoint)

  if (!metadata) {
    process.exit(1)
  }

  const {
    authorization_endpoint,
    code_challenge_methods_supported,
    scopes_supported
  } = metadata

  if (!code_challenge_methods_supported) {
    process.exit(1)
  }

  const code_challenge_method = code_challenge_methods_supported[0]

  if (!scopes_supported) {
    process.exit(1)
  }

  // shuffle the array and pick the first 4 scopes
  const scopes = scopes_supported.sort(() => 0.5 - Math.random()).slice(0, 4)
  console.log('scopes (chosen by the user)', scopes)

  const state = crypto.randomBytes(12).toString('hex')
  console.log('state (generated by the client)', state)

  const client_id = 'https://micropub.fly.dev/id'
  const redirect_uri = 'https://micropub.fly.dev/auth/callback'

  const auth = authorizationRequestUrl({
    authorization_endpoint,
    client_id,
    code_challenge_method,
    code_verifier_length: 128,
    me,
    redirect_uri,
    scopes,
    state
  })

  console.log(`request to the authorization endpoint ${authorization_endpoint}`)
  console.log(auth)
}

run()