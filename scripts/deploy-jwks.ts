import { exec } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import * as jose from 'jose'
import { nanoid } from 'nanoid'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { APPLICATION_JSON } from '../src/lib/content-type.js'

const execAsync = promisify(exec)

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

interface ReadJWKSConfig {
  public_path: string
  private_path: string
}

interface DeployPublicJWKSConfig {
  public_jwks: string
}

const deployPublicJWKS = async ({ public_jwks }: DeployPublicJWKSConfig) => {
  const region = 'auto'
  const account_id = process.env.CLOUDFLARE_ACCOUNT_ID!
  const endpoint = `https://${account_id}.r2.cloudflarestorage.com`

  const credentials = {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
  }

  const s3 = new S3Client({ region, endpoint, credentials })

  const Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!
  const subdir = 'misc'
  const filename = `jwks-public.json`
  const Key = `${subdir}/${filename}`
  const public_base_url = 'https://content.giacomodebidda.com/'
  const public_url = `${public_base_url}${Key}`

  const params = {
    Bucket,
    Key,
    Body: public_jwks,
    ContentType: APPLICATION_JSON
  }

  const output = await s3.send(new PutObjectCommand(params))
  if (output.$metadata.httpStatusCode === 200) {
    console.log(`JWKS hosted at ${public_url}`)
  }
}

interface DeployPrivateJWKSConfig {
  private_jwks: string
}

const deployPrivateJWKS = async ({ private_jwks }: DeployPrivateJWKSConfig) => {
  const cmd = `fly secrets set JWKS=${private_jwks}`

  const { stderr, stdout } = await execAsync(cmd)
  if (stderr) {
    console.error(stderr)
  }
  if (stdout) {
    console.log(stdout)
  }
}

// Generate at least two JWK keys for each JWKS, so they are easy to rotate
const run = async () => {
  const public_path = path.join(assets_dir, 'jwks-public.json')
  const public_jwks = await fs.readFile(public_path, 'utf8')

  // const private_path = path.join(secrets_dir, 'jwks-private.json')
  // const private_jwks = await fs.readFile(private_path, 'utf8')
  const private_jwks = process.env.JWKS!

  await deployPublicJWKS({ public_jwks })
  await deployPrivateJWKS({ private_jwks })
}

run()
