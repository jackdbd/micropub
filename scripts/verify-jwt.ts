import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as jose from 'jose'
import * as DEFAULT from '../src/defaults.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const secrets_dir = path.join(__dirname, '..', 'secrets')

interface VerifyConfig {
  explicitly_choose_jwk?: boolean
  jwks: { keys: jose.JWK[] }
  jwt: string
}

const verify = async ({ explicitly_choose_jwk, jwks, jwt }: VerifyConfig) => {
  const header = jose.decodeProtectedHeader(jwt)
  console.log('=== JWT protected header ===')
  console.log(header)

  let payload: jose.JWTPayload
  if (explicitly_choose_jwk) {
    console.log('=== Option 1: find JWK manually ===')
    // Option 1: explicitly pick the kid to use
    const alg = header.alg
    const kid = header.kid
    const jwk = jwks.keys.find((k: any) => k.kid === kid)
    if (!jwk) {
      throw new Error(`JWKS has no kid=${kid}`)
    }

    console.log('=== JWK used to verify the JWT ===')
    console.log(jwk)

    const pubkey = await jose.importJWK(jwk, alg)
    // const { payload } = await jose.jwtVerify(jwt, pubkey)
    // Stricter validation: verify also the issuer
    const verify_result = await jose.jwtVerify(jwt, pubkey, {
      issuer: 'urn:example:issuer'
    })
    payload = verify_result.payload

    console.log(
      `=== TIP: copy the JWT and the JSON STRING of the public JWK kid=${kid} and verify on https://jwt.io/ ===`
    )
    console.log('=== JWT ===')
    console.log(jwt)
    console.log('=== Public JWK to use ===')
    console.log(kid)
  } else {
    console.log('=== Option 2: using JWKS ===')
    // Option 2: just tell jose to use the JWKS and let it figure out which kid
    // to use for JWT verification.
    const JWKS = jose.createLocalJWKSet(jwks)
    const verify_result = await jose.jwtVerify(jwt, JWKS, {
      issuer: 'urn:example:issuer'
    })
    payload = verify_result.payload
  }

  console.log('=== JWT payload ===')
  console.log(payload)
}

const runLocal = async () => {
  const jwks_path = path.join(secrets_dir, 'jwks-pub.json')
  const str = await fs.readFile(jwks_path, 'utf8')
  const jwks = JSON.parse(str)

  const jwt_path = path.join(secrets_dir, 'jwt.txt')
  const jwt = await fs.readFile(jwt_path, 'utf8')

  const explicitly_choose_jwk = true
  // const explicitly_choose_jwk = false
  await verify({ explicitly_choose_jwk, jwt, jwks })
}

const runRemote = async () => {
  const jwt_path = path.join(secrets_dir, 'jwt.txt')
  const jwt = await fs.readFile(jwt_path, 'utf8')

  const jwks_url = new URL(DEFAULT.JWKS_PUBLIC_URL)
  const JWKS = jose.createRemoteJWKSet(jwks_url)

  const verify_result = await jose.jwtVerify(jwt, JWKS)
  const payload = verify_result.payload
  console.log('=== JWT payload ===')
  console.log(payload)
}

runRemote()
