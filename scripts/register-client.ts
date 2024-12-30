import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import * as fs from '../src/lib/fs-storage/index.js'
import * as mem from '../src/lib/in-memory-storage/index.js'

const report_all_ajv_errors = true
const ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])

const initAndDefRegisterClientFs = async () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const dirpath = path.join(__dirname, '..', 'assets')

  const filepath = await fs.init({ dirpath, filename: 'clients.json' })
  return fs.defRegisterClient({ ajv, filepath, report_all_ajv_errors })
}

const initAndDefRegisterClientMem = async () => {
  const atom = await mem.initClientsStorage()
  return mem.defRegisterClient({ ajv, atom, report_all_ajv_errors })
}

const run = async () => {
  const args = process.argv.slice(2)
  let [
    _me_flag,
    me,
    _client_id_flag,
    client_id,
    _redirect_uri_flag,
    redirect_uri,
    ...rest
  ] = args

  if (!me) {
    me = 'https://giacomodebidda.com/'
  }
  if (!client_id) {
    client_id = 'http://localhost:3001/id'
  }
  if (!redirect_uri) {
    redirect_uri = 'http://localhost:3001/auth/callback'
  }

  const registerClient = await initAndDefRegisterClientFs()
  // const registerClient = await initAndDefRegisterClientMem()

  const { error, value } = await registerClient({ me, client_id, redirect_uri })

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.info(value.message)
}

run()
