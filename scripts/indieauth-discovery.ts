import crypto from 'node:crypto'
import {
  metadataEndpoint,
  serverMetadata,
  authorizationUrl
} from '../src/lib/indieauth/index.js'

const run = async () => {
  const me = 'https://giacomodebidda.com/'
  // const me = 'https://aaronparecki.com/'
  // const me = 'https://paulrobertlloyd.com/'
  // const me = 'https://www.jvt.me/'
  // const me = 'https://barryfrost.com/' // no indieauth metadata endpoint
  // const me = 'https://chrisburnell.com/' // no indieauth metadata endpoint
  // const me = 'https://marksuth.dev/' // no indieauth metadata endpoint
  // const me = 'https://grant.codes/' // no indieauth metadata endpoint
  // const me = 'https://keithjgrant.com/' // no indieauth metadata endpoint
  // const me = 'https://waterpigs.co.uk/' // no indieauth metadata endpoint

  const { error, value: metadata_endpoint } = await metadataEndpoint(me)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log(`Metadata endpoint for ${me}: ${metadata_endpoint}`)

  const { error: metadata_error, value: metadata } = await serverMetadata(
    metadata_endpoint
  )

  if (metadata_error) {
    console.error(metadata_error)
    process.exit(1)
  }

  console.log(`Server metadata for ${me}`)
  console.log(metadata)
}

// run()

const main = async () => {
  const me = 'https://giacomodebidda.com/'

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
    // issuer,
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

  const state = crypto.randomBytes(12).toString('hex')
  console.log('state', state)

  const client_id = 'https://micropub.fly.dev/id'
  const redirect_uri = 'https://micropub.fly.dev/auth/callback'

  const auth = authorizationUrl({
    authorization_endpoint,
    client_id,
    code_challenge_method,
    code_verifier_length: 128,
    me,
    redirect_uri,
    scopes,
    state
  })

  console.log('url', auth.url)
  console.log('state', auth.state)
  console.log('code_verifier', auth.code_verifier)
}

main()
