import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import {
  compactEmptyLines,
  licenseLink,
  link,
  toc,
  transcludeFile
} from '@thi.ng/transclude'
import { schemaToMarkdown } from '../../schema-to-markdown.js'
import { options as plugin_options } from './schemas/index.js'

const run = async () => {
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      'package-root': { type: 'string', short: 'p' }
    }
  })

  const { 'package-root': pkg_root } = values
  if (!pkg_root) {
    throw new Error('package-root not set')
  }

  const repo_root = path.resolve(pkg_root, '..', '..', '..')
  const schemas_root = path.join(repo_root, 'schemas')

  const pluginOptions = schemaToMarkdown({
    level: 1,
    schema: plugin_options,
    schemas_root
  })

  const pkg = {
    author: { name: 'Giacomo Debidda' },
    license: 'MIT',
    name: 'fastify-token-endpoint'
  }

  // const pkg = JSON.parse(
  //   readFileSync(path.resolve(pkg_root, 'package.json'), {
  //     encoding: 'utf-8'
  //   })
  // )

  const fpath = path.resolve(pkg_root, 'tpl.readme.md')
  console.log(`generating README.md for ${pkg.name} from ${fpath}`)

  const project_started_in_year = 2024
  const current_year = new Date().getFullYear()

  const transcluded = transcludeFile(fpath, {
    user: pkg.author,
    templates: {
      // See how I did this in undici
      // https://github.com/jackdbd/undici/blob/a1b00187b69f26d56c707103acd21c9691ac0a8b/scripts/readme.ts#L104
      // 'pkg.deps': () => {
      //   return [`## Dependencies`, '\n\n', 'table of dependencies here'].join(
      //     ''
      //   )
      // },

      // 'pkg.description': pkg.description,

      'pkg.installation': () => {
        const lines = [`## Installation`]

        lines.push('\n\n')
        lines.push(`\`\`\`sh`)
        lines.push('\n')
        lines.push(`npm install ${pkg.name}`)
        lines.push('\n')
        lines.push(`\`\`\``)

        return lines.join('')
      },

      'pkg.license': ({ user }) => {
        const copyright =
          current_year > project_started_in_year
            ? `&copy; ${project_started_in_year} - ${current_year}`
            : `&copy; ${current_year}`

        const lines = [
          `## License`,
          '\n\n',
          `${copyright} ${link(
            user.name,
            'https://www.giacomodebidda.com/'
          )} // ${licenseLink(pkg.license)}`
        ]
        return lines.join('')
      },

      'pkg.name': pkg.name,

      pluginOptions
    },

    post: [toc(), compactEmptyLines]
  })

  const outdoc = 'README.md'
  // console.log(`=== ${outdoc} BEGIN ===`)
  // console.log(transcluded.src)
  // console.log(`=== ${outdoc} END ===`)
  writeFileSync(path.join(pkg_root, outdoc), transcluded.src)
}

run()
