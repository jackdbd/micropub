import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as jose from 'jose'
import { nanoid } from 'nanoid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const secrets_dir = path.join(__dirname, '..', 'secrets')
const assets_dir = path.join(__dirname, '..', 'assets')

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
  const { public_jwks, private_jwks } = await generateJWKS({
    algorithm: 'RS256',
    n: 2
  })

  await writeJWKS({ jwks: public_jwks, dirpath: assets_dir, name: 'jwks-pub' })
  await writeJWKS({ jwks: private_jwks, dirpath: secrets_dir, name: 'jwks' })
}

run()
