import { exec } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { APPLICATION_JSON } from '../src/lib/content-type.js'
import * as DEFAULT from '../src/defaults.js'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assets_dir = path.join(__dirname, '..', 'assets')

interface DeployPublicJWKSConfig {
  public_jwks: string
}

const deployPublicJWKSToCloudflareR2 = async ({
  public_jwks
}: DeployPublicJWKSConfig) => {
  const region = 'auto'
  const account_id = DEFAULT.CLOUDFLARE_ACCOUNT_ID!
  const endpoint = `https://${account_id}.r2.cloudflarestorage.com`

  const credentials = {
    accessKeyId: DEFAULT.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: DEFAULT.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
  }

  const s3 = new S3Client({ region, endpoint, credentials })

  const Bucket = DEFAULT.CLOUDFLARE_R2_BUCKET_NAME!
  const subdir = 'misc'
  const filename = 'jwks-pub.json'
  const Key = `${subdir}/${filename}`
  const public_base_url = DEFAULT.MEDIA_PUBLIC_BASE_URL
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

const deployPrivateJWKSToFly = async ({
  private_jwks
}: DeployPrivateJWKSConfig) => {
  const cmd = `fly secrets set JWKS=${private_jwks}`

  const { stderr, stdout } = await execAsync(cmd)
  if (stderr) {
    console.error(stderr)
  }
  if (stdout) {
    console.log(stdout)
  }
}

const run = async () => {
  const public_path = path.join(assets_dir, 'jwks-pub.json')
  const public_jwks = await fs.readFile(public_path, 'utf8')

  await deployPublicJWKSToCloudflareR2({ public_jwks })
  await deployPrivateJWKSToFly({ private_jwks: DEFAULT.JWKS! })

  console.log(`Do NOT forget to update the secret on GitHub too`)
  console.log(`Copy and paste the JSON string secrets/jwks.json here:`)
  console.log(
    'https://github.com/jackdbd/micropub/settings/secrets/actions/JWKS'
  )
}

run()
