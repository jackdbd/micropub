import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as jose from 'jose'
import { nanoid } from 'nanoid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const secrets_dir = path.join(__dirname, '..', 'secrets')

const pickRandomKid = (keys: jose.JWK[]) => {
  const i = Math.floor(Math.random() * keys.length)
  return keys[i].kid!
}

interface SignConfig {
  jwks: { keys: jose.JWK[] }
  kid: string
}

const sign = async (config: SignConfig) => {
  const { jwks, kid } = config

  const jwk = jwks.keys.find((k: any) => k.kid === kid)
  if (!jwk) {
    throw new Error(`JWKS has no kid=${kid}`)
  }

  const alg = jwk.alg
  if (!alg) {
    throw new Error(`JWK has no alg`)
  }

  const private_key = await jose.importJWK(jwk)

  const payload = {
    me: 'https://giacomodebidda.com/',
    scope: 'profile email create update delete undelete media draft',
    'urn:example.com:custom_claim': 'foo'
  }

  console.log('=== JWT will be signed with this kid ===')
  console.log(kid)

  const exp = '120 seconds' // useful for testing
  // const exp = '1 hour' // pretty common choice for access tokens

  const iss = __filename
  // The app should set the `iss` claim to the URL of the token endpoint, since
  // it's the token endpoint the one who issues the JWT.
  // const iss = 'https://example.com/token'
  // If you follow the OpenID Connect Discovery standard, the iss value should
  // match the URL of your .well-known/openid-configuration file (if you have one).

  const jwt_to_sign = new jose.SignJWT(payload)
    .setProtectedHeader({ alg, kid })
    .setExpirationTime(exp)
    .setIssuedAt()
    .setIssuer(iss)
    .setJti(nanoid())

  const jwt = await jwt_to_sign.sign(private_key)
  return jwt
}

const privateJWKS = async () => {
  // const jwks_path = path.join(secrets_dir, 'jwks-private.json')
  // const str = await fs.readFile(jwks_path, 'utf8')
  // return JSON.parse(str) as { keys: jose.JWK[] }
  return JSON.parse(process.env.JWKS!) as { keys: jose.JWK[] }
}

const run = async () => {
  const jwks = await privateJWKS()

  const kid = pickRandomKid(jwks.keys)

  const jwt = await sign({ jwks, kid })

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
