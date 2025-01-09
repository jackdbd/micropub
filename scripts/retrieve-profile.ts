import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defAtom } from '@thi.ng/atom'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  ProfileTable,
  RetrieveProfile
} from '../src/lib/profile-storage-interface/index.js'

// implementations
import * as fs_impl from '../src/lib/fs-storage/index.js'
import * as mem_impl from '../src/lib/in-memory-storage/index.js'
import * as sqlite_impl from '../src/lib/sqlite-storage/index.js'
import { createClient } from '@libsql/client'

// Run this script with --impl <impl> to test an implementation ////////////////
// const IMPLEMENTATION = 'fs'
// const IMPLEMENTATION = 'mem'
const IMPLEMENTATIONS = ['fs', 'mem', 'turso']
const args = process.argv.slice(2)
assert.ok(args && args[0] === '--impl', `the first CLI arg must be --impl`)
const IMPLEMENTATION = args[1]
assert.ok(
  IMPLEMENTATION === 'fs' ||
    IMPLEMENTATION === 'mem' ||
    IMPLEMENTATION === 'turso',
  `the second CLI arg must be one of: ${IMPLEMENTATIONS.join(', ')}`
)
////////////////////////////////////////////////////////////////////////////////

interface Config {
  implementation: 'fs' | 'mem' | 'turso'
}

const atom = defAtom<ProfileTable>({})

const run = async (config: Config) => {
  const { implementation } = config

  const report_all_ajv_errors = true

  const ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
    'email',
    'uri'
  ])

  const args = process.argv.slice(2 + 2)

  let [_me_flag, me, ...rest] = args

  if (!me) {
    me = 'https://giacomodebidda.com/'
  }

  let retrieveProfile: RetrieveProfile
  switch (implementation) {
    case 'fs': {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      const assets_dir = path.join(__dirname, '..', 'assets')
      const filepath = path.join(assets_dir, 'profiles.json')

      retrieveProfile = fs_impl.defRetrieveProfile({
        ajv,
        filepath,
        report_all_ajv_errors
      })

      break
    }
    case 'mem': {
      retrieveProfile = mem_impl.defRetrieveProfile({
        ajv,
        atom,
        report_all_ajv_errors
      })

      break
    }
    case 'turso': {
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_DATABASE_TOKEN!
      })
      retrieveProfile = sqlite_impl.defRetrieveProfile({
        ajv,
        client,
        report_all_ajv_errors
      })

      break
    }
    default: {
      throw new Error(`${implementation} not implemented`)
    }
  }

  const { error, value: profile } = await retrieveProfile(me)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log(`profile info about ${me}`)
  console.log(profile)
}

run({ implementation: IMPLEMENTATION })
