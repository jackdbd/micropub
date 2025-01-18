import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import c from 'ansi-colors'
import * as jose from 'jose'
import { nanoid } from 'nanoid'
import yargs from 'yargs/yargs'
import { DEFAULT, LINK_BUGS } from './constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const secrets_dir = path.join(__dirname, '..', 'secrets')
const assets_dir = path.join(__dirname, '..', 'assets')

const USAGE = `Generate a private JSON Web Key Set (JWKS) and a public JWKS, each one containing n JSON Web Keys (JWK).`

const argv = await yargs(process.argv.slice(2))
  .usage(`./$0 - ${USAGE}`)
  .option('algorithm', {
    describe: 'Algorithm to use',
    choices: ['RS256'],
    default: 'RS256',
    type: 'string'
  })
  .option('num-keys', {
    alias: 'n',
    demandOption: true,
    describe: 'Number of keys to in each JSON Web Key Set',
    // default: 2,
    type: 'number'
  })
  .example(
    '$0 -n 3',
    'Generate a JWKS containing 3 public keys, and a JWKS containing 3 private keys'
  )
  .help('help')
  .wrap(80)
  .epilogue(
    [
      `Bugs:\n  ${LINK_BUGS}`,
      `JSON Web Key (JWK):\n  https://datatracker.ietf.org/doc/html/rfc7517`
    ].join('\n\n')
  ).argv

interface GenConfig {
  algorithm: 'RS256'
  n: number
}

export const generateJWKS = async ({ algorithm: alg, n }: GenConfig) => {
  const public_jwks: jose.JWK[] = []

  const private_jwks: jose.JWK[] = []

  const promises = Array.from({ length: n }).map(async (_n, i) => {
    const { publicKey, privateKey } = await jose.generateKeyPair(alg)
    const publicJwk = await jose.exportJWK(publicKey)
    const privateJwk = await jose.exportJWK(privateKey)

    const kid = nanoid()
    public_jwks.push({ ...publicJwk, alg, kid })
    private_jwks.push({ ...privateJwk, alg, kid })
  })

  await Promise.all(promises)
  return { public_jwks, private_jwks }
}

interface WriteJWKSConfig {
  jwks: jose.JWK[]
  dirpath: string
  name: string
}

const writeJWKS = async ({ jwks, dirpath, name }: WriteJWKSConfig) => {
  const json = JSON.stringify({ keys: jwks })

  const json_path = path.join(dirpath, `${name}.json`)
  await fs.writeFile(path.join(dirpath, `${name}.json`), json, 'utf8')
  console.log(`wrote ${json_path}`)

  const txt_path = path.join(dirpath, `${name}.txt`)
  await fs.writeFile(txt_path, JSON.stringify(json), 'utf8')
  console.log(`wrote ${txt_path}`)
}

// Generate at least two JWK keys for each JWKS, so they are easy to rotate
const run = async () => {
  const { algorithm, numKeys: n } = argv

  const { public_jwks, private_jwks } = await generateJWKS({
    algorithm: algorithm as any,
    n
  })

  console.log(c.green(`generated a JWKS containing ${n} public keys`))
  await writeJWKS({ jwks: public_jwks, dirpath: assets_dir, name: 'jwks-pub' })
  console.log(c.green(`public JWKS written to ${secrets_dir}`))

  console.log(c.green(`generated a JWKS containing ${n} private keys`))
  await writeJWKS({ jwks: private_jwks, dirpath: secrets_dir, name: 'jwks' })
  console.log(c.green(`private JWKS written to ${secrets_dir}`))
}

run()
