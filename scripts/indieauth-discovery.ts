import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import canonicalUrl from '@jackdbd/canonical-url'
import { metadataEndpoint, serverMetadata } from '@jackdbd/indieauth'
import { DEFAULT } from './constants.js'
import { exitOne } from './utils.js'

const __filename = fileURLToPath(import.meta.url)
const prefix = `[${__filename}] `

const run = async () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      // me: { type: 'string',short: 'm' },
      verbose: { type: 'boolean' }
    }
  })

  const [me_given, ...rest] = positionals

  if (rest.length > 0) {
    exitOne(
      `${prefix}accepts exactly one positional argument (e.g. ${DEFAULT.ME_BEFORE_CANONICALIZATION})`
    )
    return
  }

  if (values.verbose) {
    console.log(`${prefix}ensuring given profile URL is a canonical URL`)
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

  const me = me_given
    ? canonicalUrl(me_given)
    : DEFAULT.ME_AFTER_CANONICALIZATION

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
