import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import type { TObject } from '@sinclair/typebox'

export interface SchemaToMarkdownConfig {
  level: number // initial markdown heading level
  schema: TObject
  schemas_root: string
}

export const schemaToMarkdown = (config: SchemaToMarkdownConfig) => {
  const { level, schema, schemas_root } = config

  if (!schema.title) {
    const s = JSON.stringify(schema, null, 2)
    throw new Error(
      `this schema of type ${schema.type} does not have a title:\n${s}`
    )
  }
  const schema_name = `${schema.$id}-schema`
  const schema_str = JSON.stringify(schema, null, 2)

  const fpath = path.join(schemas_root, `${schema_name}.json`)
  writeFileSync(fpath, schema_str, { encoding: 'utf8' })
  console.log(`wrote ${fpath}`)

  // jsonschema2mk does not support file sytem refs, so a TypeBox schema like
  // this one will cause jsonschema2mk to throw:
  // ```
  // const foo: Type.Object({ abc: "def" }) // this is fine
  // const bar: Type.Ref(foo) // this causes jsonschema2mk to throw
  // ```

  // https://github.com/simonwalz/jsonschema2mk#command-line-options
  return execSync(`jsonschema2mk --schema ${fpath} --level ${level}`).toString()
}
