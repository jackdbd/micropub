import { createHash } from 'node:crypto'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import seedrandom from 'seedrandom'
import {
  geo_uri,
  h_adr,
  h_card,
  h_cite,
  h_entry,
  h_event,
  h_geo,
  h_item
} from '../../lib/microformats2/index.js'
import {
  micropub_get_request,
  micropub_post_request,
  plugin_options
} from './schemas.js'

export interface Config {
  allErrors: boolean
}

/**
 * Compile all schemas and return validate functions.
 *
 * The order of the schemas is important, because some schemas reference other.
 */
export const compileSchemasAndGetValidateFunctions = (config: Config) => {
  // Do NOT use allErrors in production
  // https://ajv.js.org/security.html#security-risks-of-trusted-schemas
  // We need these extra formats to fully support fluent-json-schema
  // https://github.com/ajv-validator/ajv-formats#formats
  const { allErrors } = config

  // TODO: can I get an existing Ajv instance somehow? Should I?
  const ajv = addFormats(new Ajv({ allErrors }), [
    'date',
    'date-time',
    'email',
    'hostname',
    'ipv4',
    'ipv6',
    'json-pointer',
    'regex',
    'relative-json-pointer',
    'time',
    'uri',
    'uri-reference',
    'uri-template',
    'uuid'
  ])

  const validateGeoURI = ajv.compile(geo_uri)
  const validateH_geo = ajv.compile(h_geo)
  const validateH_adr = ajv.compile(h_adr)
  const validateH_card = ajv.compile(h_card)
  const validateH_cite = ajv.compile(h_cite)
  const validateH_entry = ajv.compile(h_entry)
  const validateH_event = ajv.compile(h_event)
  const validateH_item = ajv.compile(h_item)

  const validatePluginOptions = ajv.compile(plugin_options)

  const validateMicropubGetRequest = ajv.compile(micropub_get_request)
  const validateMicropubPostRequest = ajv.compile(micropub_post_request)

  return {
    validateGeoURI,
    validateH_adr,
    validateH_card,
    validateH_cite,
    validateH_entry,
    validateH_event,
    validateH_geo,
    validateH_item,
    validatePluginOptions,
    validateMicropubGetRequest,
    validateMicropubPostRequest
  }
}

interface CodeVerifierConfig {
  len: number
  seed?: string
}

/**
 * Generates a plaintext random string.
 *
 * Optionally pass a seed (useful in tests).
 *
 * The IndieAuth client creates a code verifier for each authorization request
 * by generating a random string using the characters
 * [A-Z] / [a-z] / [0-9] / - / . / _ / ~ with a minimum length of 43 characters
 * and maximum length of 128 characters. This value is stored on the client and
 * will be used in the authorization code exchange step later.
 *
 * See: https://indieauth.spec.indieweb.org/#request
 */
export const codeVerifier = ({ seed, len }: CodeVerifierConfig) => {
  const rng = seedrandom(seed)

  // ASCII character set (printable characters)
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

  let str = ''
  for (let i = 0; i < len; i++) {
    const idx = Math.floor(rng() * charset.length)
    str += charset[idx]
  }

  return str
}

interface CodeChallengeConfig {
  code_verifier: string
  code_challenge_method: string
}

/**
 * Generates a PKCE code challenge using the code_verifier and a code_challenge_method.
 *
 * The IndieAuth client creates the code challenge derived from the code
 * verifier by calculating the SHA256 hash of the code verifier and
 * Base64-URL-encoding the result.
 *
 * ```
 * code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
 * ```
 *
 * See: https://indieauth.spec.indieweb.org/#authorization-request
 */
export const codeChallenge = ({
  code_challenge_method,
  code_verifier
}: CodeChallengeConfig) => {
  let alg = ''
  switch (code_challenge_method) {
    case 'S256':
      alg = 'sha256'
      break
    default:
      throw new Error(
        `Unsupported code_challenge_method: ${code_challenge_method}`
      )
  }
  return createHash(alg).update(code_verifier).digest('base64url')
}
