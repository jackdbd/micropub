import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defAtom } from '@thi.ng/atom'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type {
  ProfileTable,
  StoreProfile
} from '../src/lib/profile-storage-interface/index.js'

// implementations
import * as fs_impl from '../src/lib/fs-storage/index.js'
import * as mem_impl from '../src/lib/in-memory-storage/index.js'

// Run this script with --impl <impl> to test an implementation ////////////////
// const IMPLEMENTATION = 'fs'
// const IMPLEMENTATION = 'mem'
const IMPLEMENTATIONS = ['fs', 'mem']
const args = process.argv.slice(2)
assert.ok(args && args[0] === '--impl', `the first CLI arg must be --impl`)
const IMPLEMENTATION = args[1]
assert.ok(
  IMPLEMENTATION === 'fs' || IMPLEMENTATION === 'mem',
  `the second CLI arg must be one of: ${IMPLEMENTATIONS.join(', ')}`
)
////////////////////////////////////////////////////////////////////////////////

const atom = defAtom<ProfileTable>({})

interface Config {
  implementation: 'fs' | 'mem'
}

const run = async (config: Config) => {
  const { implementation } = config

  const report_all_ajv_errors = true

  const ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
    'email',
    'uri'
  ])

  const args = process.argv.slice(2 + 2)
  let [
    _me_flag,
    me,
    _name_flag,
    name,
    _photo_flag,
    photo,
    _url_flag,
    url,
    _email_flag,
    email,
    ...rest
  ] = args
  if (!me) {
    me = 'https://giacomodebidda.com/'
  }
  if (!name) {
    name = 'Giacomo Debidda'
  }

  let storeProfile: StoreProfile
  switch (implementation) {
    case 'fs': {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      const assets_dir = path.join(__dirname, '..', 'assets')
      const filepath = path.join(assets_dir, 'profiles.json')

      if (!fs.existsSync(filepath)) {
        console.log(`Creating ${filepath}`)
        fs.writeFileSync(filepath, JSON.stringify({}), 'utf8')
      }

      storeProfile = fs_impl.defStoreProfile({
        ajv,
        filepath,
        report_all_ajv_errors
      })

      break
    }
    case 'mem': {
      storeProfile = mem_impl.defStoreProfile({
        ajv,
        atom,
        report_all_ajv_errors
      })

      break
    }
    default: {
      throw new Error(`${implementation} not implemented`)
    }
  }

  const { error, value } = await storeProfile({
    profile_url: me,
    name,
    email,
    photo,
    url
  })

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log(`stored info about profile URL ${me} in record ID ${value.id}`)
  // Since we cannot inspect the state of the in-memory after this script
  // exits, we print it here.
  if (IMPLEMENTATION === 'mem') {
    console.log(`=== in-memory implementation state ===`)
    console.log(atom.deref())
  }
}

run({ implementation: IMPLEMENTATION })
