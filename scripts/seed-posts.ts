import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { createClient } from '@libsql/client'
import { SQLITE_DATABASE } from '../src/constants.js'
import { DEFAULT } from './constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assets_dir = path.join(__dirname, '..', 'assets')
const mp_clients_dir = path.join(assets_dir, 'micropub-client-requests')
const quill_dir = path.join(mp_clients_dir, 'quill')
const indiepass_dir = path.join(mp_clients_dir, 'indiepass')

const TABLE = 'posts'

const sql = `
INSERT INTO ${TABLE}
  (mf2, created_at, updated_at)
VALUES
  (:json, :created_at, :updated_at);`

// Same as above, but with positional args
// const sql = `
// INSERT INTO ${TABLE}
//   (mf2, created_at, updated_at)
// VALUES
//   (?, ?, ?);`

const select_query = `SELECT * FROM posts WHERE mf2->>'$.content' like '%simple%';`

const run = async () => {
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      environment: { type: 'string', short: 'e', default: DEFAULT.ENVIRONMENT },
      reset: { type: 'boolean', default: DEFAULT.RESET }
    }
  })

  const env = values.environment!
  const client = createClient(SQLITE_DATABASE[env])

  if (values.reset) {
    const sql = `DELETE FROM \`${TABLE}\` RETURNING *;`
    console.log(`reset table: ${sql}`)
    const rs = await client.execute(sql)
    console.log(`deleted ${rs.rows.length} rows`)
  }

  const note = await readFile(path.join(indiepass_dir, 'note.json'), 'utf8')
  const read = await readFile(path.join(indiepass_dir, 'read.json'), 'utf8')
  const like = await readFile(path.join(indiepass_dir, 'like.json'), 'utf8')
  const bookmark = await readFile(path.join(quill_dir, 'bookmark.json'), 'utf8')

  const created_at = Math.floor(Date.now() / 1000)
  const updated_at = null

  // await client.execute({ sql, args: { json: note, created_at, updated_at } })
  // Same as above, but with positional args
  // await client.execute({ sql, args: [json, created_at, updated_at] })

  await client.batch(
    [
      { sql, args: { json: note, created_at, updated_at } },
      { sql, args: { json: read, created_at, updated_at } },
      { sql, args: { json: like, created_at, updated_at } },
      { sql, args: { json: bookmark, created_at, updated_at } }
    ],
    'write'
  )

  console.log(`executing query:\n${select_query}`)
  const rs = await client.execute(select_query)
  console.log(`the query returned ${rs.rows.length} rows`)
  for (const row of rs.rows) {
    console.log(row)
  }
}

run()
