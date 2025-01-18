import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
// import { execSync } from 'node:child_process'
// import type { TObject } from '@sinclair/typebox'
import {
  licenseLink,
  link,
  toc,
  compactEmptyLines,
  transcludeFile
} from '@thi.ng/transclude'
import { schemaToMarkdown } from '../../schema-to-markdown.js'
import {
  options as plugin_options,
  access_token_request_body,
  authorization_request_querystring
  // authorization_response_body_success,
  // authorization_response_querystring,
  // profile_url_request_body,
  // profile_url_response_body_success
} from './schemas.js'

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

  const accessTokenRequestBody = schemaToMarkdown({
    level: 2,
    schema: access_token_request_body,
    schemas_root
  })

  const authorizationRequestQuerystring = schemaToMarkdown({
    level: 2,
    schema: authorization_request_querystring,
    schemas_root
  })

  const pluginOptions = schemaToMarkdown({
    level: 1,
    schema: plugin_options,
    schemas_root
  })

  const pkg = {
    author: { name: 'Giacomo Debidda' },
    description: [
      `Fastify plugin that adds an [IndieAuth Authorization Endpoint](https://indieauth.spec.indieweb.org/#authorization-endpoint) to a Fastify server.`,
      '\n\n',
      `An IndieAuth Authorization Endpoint is responsible for obtaining authentication or authorization consent from the end user and generating and verifying authorization codes.`
    ].join(''),
    license: 'MIT',
    name: 'fastify-authorization-endpoint'
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
      accessTokenRequestBody,

      authorizationRequestQuerystring,

      configuration: [`## Configuration`, '\n\n'].join(''),

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
