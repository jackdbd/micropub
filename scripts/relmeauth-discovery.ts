import { relMeHrefs } from '../src/lib/relmeauth/index.js'

const run = async () => {
  const args = process.argv.slice(2)
  let [_me_flag, me, ...rest] = args

  if (!me) {
    me = 'https://giacomodebidda.com/'
  }

  const { error, value: hrefs } = await relMeHrefs(me)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log(`rel="me" links for ${me}`)
  console.log(hrefs)
}

run()
