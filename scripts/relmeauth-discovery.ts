import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { relMeHrefs } from '../src/lib/relmeauth/index.js'
import { canonicalUrl } from '../src/lib/url-canonicalization.js'
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

  const me = me_given
    ? canonicalUrl(me_given)
    : DEFAULT.ME_AFTER_CANONICALIZATION

  const { error, value: hrefs } = await relMeHrefs(me)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log(`rel="me" links found at URL ${me}`)
  console.log(hrefs)
}

run()
