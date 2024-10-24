import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nunjucks from 'nunjucks'
// import { tap } from '../src/nunjucks/filters.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const templates_dir = path.join(__dirname, '..', 'src', 'templates')
const dist_dir = path.join(__dirname, '..', 'dist')

// TODO: this doesn't seem to work

// const env = new nunjucks.Environment()

// env.addFilter('tap', tap)

const js = nunjucks.precompile(templates_dir, {
  // asFunction: true,
  include: ['.njk'],
  // Precompile templates with Node.js compatible wrapper
  wrapper: (templates, _options) => {
    const xs = templates.map(({ name, template }) => {
      console.log(`Compiling template ${name}`)
      return `module.exports["${name}"] = ${template};`
    })
    return xs.join('\n')
  }
})

const fpath = path.join(dist_dir, 'templates.js')
fs.writeFileSync(fpath, js, 'utf8')
console.log(`Templates compiled to ${fpath}`)
