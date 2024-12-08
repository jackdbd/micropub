import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as jose from 'jose'
import * as DEFAULT from '../src/defaults.js'
import { randomKid, sign } from '../src/lib/token/sign-jwt.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const secrets_dir = path.join(__dirname, '..', 'secrets')

const privateJWKS = async () => {
  return JSON.parse(DEFAULT.JWKS!) as { keys: jose.JWK[] }
}

const run = async () => {
  const jwks = await privateJWKS()

  const { error: err_kid, value: kid } = randomKid(jwks.keys)

  if (err_kid) {
    console.error(err_kid)
    process.exit(1)
  }

  const expiration = '120 seconds' // useful for testing
  // const expiration = '1 hour' // pretty common choice for access tokens

  const issuer = __filename

  const payload = {
    me: 'https://giacomodebidda.com/',
    scope: 'profile email create update delete undelete media draft',
    'urn:example.com:custom_claim': 'foo'
  }

  const { error, value: jwt } = await sign({
    expiration,
    issuer,
    jwks,
    kid,
    payload
  })

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log('=== JWT ===')
  console.log(jwt)

  const jwt_path = path.join(secrets_dir, 'jwt.txt')
  await fs.writeFile(jwt_path, jwt, 'utf8')
  console.log(`wrote ${jwt_path}`)

  console.log('=== Copy the JWT and paste it on https://jwt.io/ ===')
  console.log(
    `Use the public JWK (as JSON string) that has kid=${kid} to verify the JWT`
  )
}

run()
