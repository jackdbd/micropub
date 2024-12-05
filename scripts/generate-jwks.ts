import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as jose from 'jose'
import { nanoid } from 'nanoid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const secrets_dir = path.join(__dirname, '..', 'secrets')
const assets_dir = path.join(__dirname, '..', 'assets')

interface Config {
  algorithm: 'RS256'
  n: number
}

const generateJWKS = async ({ algorithm: alg, n }: Config) => {
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
  public_jwks: jose.JWK[]
  public_path: string
  private_path: string
  private_jwks: jose.JWK[]
}

const writeJWKS = async ({
  public_jwks,
  public_path,
  private_jwks,
  private_path
}: WriteJWKSConfig) => {
  await fs.writeFile(public_path, JSON.stringify({ keys: public_jwks }), {
    encoding: 'utf8'
  })
  console.log(`wrote ${public_path}`)

  await fs.writeFile(private_path, JSON.stringify({ keys: private_jwks }), {
    encoding: 'utf8'
  })
  console.log(`wrote ${private_path}`)
}

// Generate at least two JWK keys for each JWKS, so they are easy to rotate
const run = async () => {
  const { public_jwks, private_jwks } = await generateJWKS({
    algorithm: 'RS256',
    n: 2
  })

  await writeJWKS({
    public_jwks,
    public_path: path.join(assets_dir, 'jwks-public.json'),
    private_jwks,
    private_path: path.join(secrets_dir, 'jwks-private.json')
  })
}

run()
