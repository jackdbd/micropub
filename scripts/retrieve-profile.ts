import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defAtom } from '@thi.ng/atom'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { ProfileTable } from '../src/lib/profile-storage-interface/index.js'

// implementations
import * as fs_impl from '../src/lib/fs-storage/index.js'
import * as mem_impl from '../src/lib/in-memory-storage/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assets_dir = path.join(__dirname, '..', 'assets')

const filepath = path.join(assets_dir, 'profiles.json')

const atom = defAtom<ProfileTable>({})

const report_all_ajv_errors = true

const ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), [
  'email',
  'uri'
])

const retrieveProfile = fs_impl.defRetrieveProfile({
  ajv,
  filepath,
  report_all_ajv_errors
})

// const retrieveProfile = mem_impl.defRetrieveProfile({
//   ajv,
//   atom,
//   report_all_ajv_errors
// })

const run = async () => {
  const args = process.argv.slice(2)
  let [_me_flag, me, ...rest] = args

  if (!me) {
    me = 'https://giacomodebidda.com/'
  }

  const { error, value: profile } = await retrieveProfile(me)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log(`profile info about ${me}`)
  console.log(profile)
}

run()
