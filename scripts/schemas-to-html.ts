import { exec } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import {
  e_content,
  h_cite,
  h_event,
  p_content
} from '../src/lib/microformats2/index.js'
// import { options } from '../src/plugins/micropub-client/schemas.js'
import { options } from '../src/plugins/micropub-endpoint/schemas.js'
import {
  micropub_get_request,
  micropub_post_request
} from '../src/plugins/micropub-endpoint/routes/schemas.js'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assets_dir = path.join(__dirname, '..', 'assets')
// const schemas_dir = path.join(assets_dir, 'json-schemas')

const microformats = async (schemas_dir: string) => {
  await fs.writeFile(
    path.join(schemas_dir, 'p-content.json'),
    JSON.stringify(p_content, null, 2),
    { encoding: 'utf-8' }
  )
  await fs.writeFile(
    path.join(schemas_dir, 'e-content.json'),
    JSON.stringify(e_content, null, 2),
    { encoding: 'utf-8' }
  )

  await fs.writeFile(
    path.join(schemas_dir, 'h-cite.json'),
    JSON.stringify(h_cite, null, 2),
    { encoding: 'utf-8' }
  )

  await fs.writeFile(
    path.join(schemas_dir, 'h-event.json'),
    JSON.stringify(h_event, null, 2),
    { encoding: 'utf-8' }
  )
}

const indieAuthClient = async (schemas_dir: string) => {
  await fs.writeFile(
    path.join(schemas_dir, 'indieauth_client-options.json'),
    JSON.stringify(options, null, 2),
    { encoding: 'utf-8' }
  )
}

const micropubEndpoint = async (schemas_dir: string) => {
  await fs.writeFile(
    path.join(schemas_dir, 'options.json'),
    JSON.stringify(options, null, 2),
    { encoding: 'utf-8' }
  )

  await fs.writeFile(
    path.join(schemas_dir, 'get-request.json'),
    JSON.stringify(micropub_get_request, null, 2),
    { encoding: 'utf-8' }
  )

  await fs.writeFile(
    path.join(schemas_dir, 'post-request.json'),
    JSON.stringify(micropub_post_request, null, 2),
    { encoding: 'utf-8' }
  )
}

const run = async () => {
  const schemas_dir = path.join(assets_dir, 'json-schemas')

  try {
    await fs.access(schemas_dir)
  } catch {
    console.log(`Directory ${schemas_dir} does not exist, creating...`)
    await fs.mkdir(schemas_dir, { recursive: true })
  }

  await indieAuthClient(schemas_dir)
  await microformats(schemas_dir)
  await micropubEndpoint(schemas_dir)

  console.log(`All schemas written to ${schemas_dir}`)

  const docs_dir = path.join(assets_dir, 'schemas-docs')
  const cmd = `generate-schema-doc ${schemas_dir} ${docs_dir}`
  const { stderr, stdout } = await execAsync(cmd)
  if (stderr) {
    console.error(stderr)
  }
  if (stdout) {
    console.log(stdout)
  }

  const port = 8090
  console.log(`=== === === === === === === === === === === === === === ===`)
  console.log(`Visit http://localhost:${port} to see the schemas`)
  console.log(`=== === === === === === === === === === === === === === ===`)
  await execAsync(`python3 -m http.server --directory ${docs_dir} ${port}`)
}

run()
