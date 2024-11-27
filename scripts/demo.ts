import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import Sqlite from 'better-sqlite3'
import type { Database } from 'better-sqlite3'

const assets_dir = path.join(process.cwd(), 'assets')
const queries_dir = path.join(process.cwd(), 'assets', 'queries')
const migrations_dir = path.join(process.cwd(), 'migrations')

const DATABASE = 'micropub.sqlite'

const preparedStatements = (db: Database) => {
  const CREATE_POST = fs.readFileSync(
    path.join(queries_dir, 'create-post.sql'),
    'utf8'
  )

  const DELETE_POST = fs.readFileSync(
    path.join(queries_dir, 'delete-post.sql'),
    'utf8'
  )

  const UNDELETE_POST = fs.readFileSync(
    path.join(queries_dir, 'undelete-post.sql'),
    'utf8'
  )

  const UPDATE_POST = fs.readFileSync(
    path.join(queries_dir, 'update-post.sql'),
    'utf8'
  )

  const SELECT_POSTS_BY_CITY = fs.readFileSync(
    path.join(queries_dir, 'posts-that-have-selected-city.sql'),
    'utf8'
  )

  return {
    createPost: db.prepare(CREATE_POST),
    deletePost: db.prepare(DELETE_POST),
    undeletePost: db.prepare(UNDELETE_POST),
    updatePost: db.prepare(UPDATE_POST),
    selectPostsByCity: db.prepare(SELECT_POSTS_BY_CITY)
  }
}

const main = async () => {
  // init DB and run migrations
  execSync(`rm -rf ${DATABASE}`)
  const db = new Sqlite(DATABASE, { readonly: false })
  db.pragma('journal_mode = WAL')

  const migration = fs.readFileSync(
    path.join(migrations_dir, '001.do.sql'),
    'utf8'
  )
  db.exec(migration)

  const {
    createPost,
    deletePost,
    undeletePost,
    updatePost,
    selectPostsByCity
  } = preparedStatements(db)

  const json = fs.readFileSync(
    path.join(assets_dir, 'jf2', 'note.json'),
    'utf8'
  )
  let result = createPost.run({ json })
  const id = result.lastInsertRowid

  result = deletePost.run({ id })
  result = updatePost.run({ id, city: 'London' })
  result = undeletePost.run({ id })

  // insert 2 posts that have 'Rome' as the city
  result = createPost.run({ json })
  updatePost.run({ id: result.lastInsertRowid, city: 'Rome' })
  result = createPost.run({ json })
  updatePost.run({ id: result.lastInsertRowid, city: 'Rome' })

  result = createPost.run({ json })
  updatePost.run({ id: result.lastInsertRowid, city: 'Paris' })

  result = deletePost.run({ id })
  result = updatePost.run({ id, city: 'London' })

  const statement = db.prepare(
    `SELECT json_extract(mf2, '$.city') AS city FROM posts;`
  )
  const json_array = statement.all() as { city: string }[]
  const cities = json_array.map((entry) => entry['city'])
  console.log(cities)

  const stmt = db.prepare(`SELECT * FROM posts WHERE mf2->>'$.city' = 'Rome';`)
  const records = stmt.all()
  console.log(records)

  console.log('=== London ===', selectPostsByCity.all({ city: 'London' }))
  console.log('=== Rome ===', selectPostsByCity.all({ city: 'Rome' }))
}

main()
