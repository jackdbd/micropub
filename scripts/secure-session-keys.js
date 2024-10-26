import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sodium from 'sodium-native' // it's a dependency of fastify-secure-session

// Use 2 keys, so we can rotate them.
// https://github.com/fastify/fastify-secure-session?tab=readme-ov-file#using-keys-with-key-rotation
const SECRETS = ['secure-session-key-one', 'secure-session-key-two']
const ENV_VARS = ['SECURE_SESSION_KEY_ONE', 'SECURE_SESSION_KEY_TWO']

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const secrets_dir = path.join(__dirname, '..', 'secrets')
const node_modules = path.join(__dirname, '..', 'node_modules')
const genkey_js = path.join(
  node_modules,
  '@fastify',
  'secure-session',
  'genkey.js'
)

const assertBufferHasValidLength = (key, buf) => {
  assert.equal(
    buf.byteLength,
    sodium.crypto_secretbox_KEYBYTES,
    `${key} should be a secret of length crypto_secretbox_KEYBYTES (${sodium.crypto_secretbox_KEYBYTES} bytes)`
  )
}

const cleanSecrets = () => {
  SECRETS.forEach((key) => {
    const fpath = path.join(secrets_dir, key)
    fs.rmSync(fpath, { force: true })
    console.log(`removed ${fpath}`)
  })
}

const writeSecrets = () => {
  SECRETS.forEach((key) => {
    const fpath = path.join(secrets_dir, key)
    const buf = execSync(`node ${genkey_js}`)
    assertBufferHasValidLength(key, buf)
    fs.writeFileSync(fpath, buf)
    console.log(`wrote ${fpath}`)
  })
}

const readFromEnv = () => {
  console.log(`\nread keys from environment variables`)
  const output = ENV_VARS.map((key) => {
    console.log(`read process.env.${key}`)
    const buf = Buffer.from(process.env[key], 'hex')
    assertBufferHasValidLength(key, buf)
    const hex = buf.toString('hex')
    return { key, hex, buf }
  })
  console.log(output)
}

const readFromSecrets = () => {
  console.log(`\nread keys from ${secrets_dir}`)
  const output = SECRETS.map((key) => {
    const fpath = path.join(secrets_dir, key)
    console.log(`read ${fpath}`)
    const buf = fs.readFileSync(fpath)
    assertBufferHasValidLength(key, buf)
    const hex = buf.toString('hex')
    return { key, hex, buf }
  })
  console.log(output)
}

const readJSONSecret = () => {
  const fpath = '/run/secrets/micropub'
  console.log(`\nread JSON secret mounted at ${fpath}`)
  const secret = JSON.parse(fs.readFileSync(fpath, 'utf8'))
  console.log(secret)
}

// cleanSecrets()
// writeSecrets()
readFromSecrets()
readFromEnv()
readJSONSecret()
