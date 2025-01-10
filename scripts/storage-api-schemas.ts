import { parseArgs } from 'node:util'
import c from 'ansi-colors'
import * as api from '../src/lib/storage-api/schemas.js'
import { logSchema } from './log-as-table.js'

const SPEC = {
  'access-token': {
    immutable: api.access_token_immutable_record,
    mutable: api.access_token_mutable_record
  },
  'authorization-code': {
    immutable: api.authorization_code_immutable_record,
    mutable: api.authorization_code_mutable_record
  },
  'client-application': {
    immutable: api.client_application_immutable_record,
    mutable: api.client_application_mutable_record
  },
  'refresh-token': {
    immutable: api.refresh_token_immutable_record,
    mutable: api.refresh_token_mutable_record
  },
  'user-profile': {
    immutable: api.user_profile_immutable_record,
    mutable: api.user_profile_mutable_record
  }
}

const run = async () => {
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      'access-token': { type: 'boolean', default: false },
      'authorization-code': { type: 'boolean', default: false },
      'client-application': { type: 'boolean', default: false },
      'refresh-token': { type: 'boolean', default: false },
      'user-profile': { type: 'boolean', default: false }
    }
  })

  // const { 'access-token': show_access_token } = values

  const available = Object.keys(SPEC)
  const shown = Object.entries(values)
    .filter(([_k, flag]) => flag)
    .map(([k, _flag]) => k)

  if (shown.length === 0) {
    console.log(`Storage API schemas available: ${available.join(', ')}`)
    console.log(`\nUse one or more of these flags to view the schemas:`)
    console.log(`${available.map((key) => `--${key}`).join('\n')}`)
  }

  for (const [key, flag] of Object.entries(values)) {
    if (flag) {
      console.log(c.green(`${key} (immutable)`))
      logSchema(SPEC[key].immutable)
      console.log(c.green(`${key} (mutable)`))
      logSchema(SPEC[key].mutable)
    }
  }

  if (shown.length > 0) {
    console.log(`Storage API schemas shown: ${shown.join(', ')}`)
  }
}

run()
