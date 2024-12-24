import { metadataEndpoint, serverMetadata } from '../src/lib/indieauth/index.js'

const run = async () => {
  const args = process.argv.slice(2)
  let [_me_flag, me, ...rest] = args

  if (!me) {
    me = 'https://giacomodebidda.com/'
  }

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

run()
