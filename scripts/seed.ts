import { faker } from '@faker-js/faker'
import c from 'ansi-colors'
import { nanoid } from 'nanoid'
import yargs from 'yargs/yargs'
import { defAjv } from '../src/ajv.js'
import { Environment, StorageBackend } from '../src/constants.js'
import type { AuthorizationCodeProps } from '../src/lib/authorization-code-storage-interface/index.js'
import type { ClientApplicationProps } from '../src/lib/clients-storage-interface/index.js'
import { codeChallenge, codeVerifier } from '../src/lib/pkce/index.js'
import type { UserProfileProps } from '../src/lib/profile-storage-interface/index.js'
import type { StoreRecord } from '../src/lib/storage-api/index.js'
import { defStorage } from '../src/lib/storage-implementations/index.js'
import type {
  AccessTokenProps,
  RefreshTokenProps
} from '../src/lib/token-storage-interface/index.js'
import { unwrapP } from '../src/lib/unwrap/index.js'
import { canonicalUrl } from '../src/lib/url-canonicalization.js'
import { DEFAULT, LINK_BUGS } from './constants.js'
import { exitOne, exitZero, exp } from './utils.js'

const USAGE = `
Seed the storage backend with some authorization codes, access tokens, refresh tokens, client applications, user profiles.`

const SCOPES = [
  'create',
  'delete',
  'draft',
  'email',
  'profile',
  'undelete',
  'update'
]

const argv = await yargs(process.argv.slice(2))
  .usage(`./$0 - ${USAGE}`)
  // .option('access-token-expiration', {
  //   describe: 'Access token expiration (human readable)',
  //   default: DEFAULT.ACCESS_TOKEN_EXPIRATION,
  //   type: 'string'
  // })
  .option('authorization-code-expiration', {
    describe: 'Authorization code expiration (human readable)',
    default: DEFAULT.AUTHORIZATION_CODE_EXPIRATION,
    type: 'string'
  })
  .option('backend', {
    alias: 'b',
    demandOption: true,
    describe: 'Storage backend',
    choices: Object.keys(StorageBackend),
    type: 'string'
  })
  .option('environment', {
    alias: 'e',
    describe: 'Environment',
    choices: ['dev', 'prod'],
    default: DEFAULT.ENVIRONMENT,
    type: 'string'
  })
  .option('issuer', {
    describe: 'Issuer of authorization codes, access tokens and refresh tokens',
    default: DEFAULT.ISSUER,
    type: 'string'
  })
  .option('me', {
    boolean: true,
    default: false,
    describe: 'If true, add a user profile about myself'
  })
  .option('num-seeds', {
    alias: 'n',
    describe: 'Number of records to generate for each record type',
    default: 5,
    type: 'number'
  })
  .option('refresh-token-expiration', {
    describe: 'Refresh token expiration (human readable)',
    default: DEFAULT.REFRESH_TOKEN_EXPIRATION,
    type: 'string'
  })
  .option('reset', {
    boolean: true,
    default: DEFAULT.RESET,
    describe:
      'If true, remove all records from the storage backend before seeding'
  })
  .example('$0 --backend sqlite --env dev', 'Seed a local SQLite database')
  .example(
    '$0 -b jsonl --reset',
    'Seed JSON Lines files, remove all data in those files before seeding'
  )
  .help('help')
  .wrap(80)
  .epilogue([`Bugs:\n  ${LINK_BUGS}`].join('\n\n')).argv

type Props = Record<string, any>

const accessToken = (props: Props): AccessTokenProps => {
  const { client_id, jti, redirect_uri } = props

  const revoked = Math.random() < 0.5
  // revocation_reason might be null/undefined even if revoked is true
  let revocation_reason: string | undefined
  if (revoked) {
    revocation_reason = Math.random() < 0.5 ? 'testing seed script' : undefined
  }

  return { client_id, jti, redirect_uri, revoked, revocation_reason }
}

const authorizationCode = (props: Props): AuthorizationCodeProps => {
  const {
    authorizationCodeExpiration,
    client_id,
    code_challenge,
    code_challenge_method,
    iss,
    me,
    redirect_uri,
    scope
  } = props

  const used = Math.random() < 0.5

  return {
    client_id,
    code: nanoid(),
    code_challenge,
    code_challenge_method,
    exp: exp(authorizationCodeExpiration),
    iss,
    me,
    redirect_uri,
    scope,
    used
  }
}

const clientApplication = (props: Props): ClientApplicationProps => {
  const { client_id, me, redirect_uri } = props
  return { client_id, me, redirect_uri }
}

const refreshToken = (props: Props): RefreshTokenProps => {
  const {
    client_id,
    iss,
    jti,
    me,
    redirect_uri,
    refreshTokenExpiration,
    scope
  } = props

  const revoked = Math.round(Math.random()) === 1 ? true : false
  // revocation_reason might be null/undefined even if revoked is true
  let revocation_reason: string | undefined
  if (revoked) {
    revocation_reason = Math.random() < 0.5 ? 'testing seed script' : undefined
  }

  return {
    client_id,
    exp: exp(refreshTokenExpiration),
    iss,
    jti,
    me,
    redirect_uri,
    refresh_token: nanoid(),
    revoked,
    revocation_reason,
    scope
  }
}

const userProfile = (props: Props): UserProfileProps => {
  const { me } = props
  // const avatar = faker.image.avatar()

  return {
    email: faker.internet.email(),
    me,
    name: faker.person.fullName(),
    url: faker.internet.url(),
    photo: faker.image.url()
  }
}

interface Config {
  label: string
  storeOne: StoreRecord
}

const storeAll = async (xs: Props[], config: Config) => {
  const storeOne = config.storeOne
  const things = config.label ?? 'things'

  const results = await Promise.allSettled(
    xs.map((props) => unwrapP(storeOne(props)))
  )

  const successes = results.filter((res) => res.status === 'fulfilled')
  if (successes.length > 0) {
    console.log(c.green(`stored ${successes.length} ${things}`))
  }

  const failures = results.filter((res) => res.status === 'rejected')
  if (failures.length > 0) {
    console.log(c.red(`could not store ${failures.length} ${things}`))
  }
}

const run = async () => {
  const {
    authorizationCodeExpiration,
    backend,
    environment,
    issuer,
    numSeeds,
    refreshTokenExpiration,
    reset
  } = argv

  const xs = Array.from({ length: numSeeds }).map((_) => {
    const code_verifier = codeVerifier({ len: 43 })
    const code_challenge_method = 'S256'
    const code_challenge = codeChallenge({
      method: code_challenge_method,
      code_verifier
    })

    const me = canonicalUrl(`https://${faker.internet.domainName()}`)

    const n_scopes = Math.floor(Math.random() * SCOPES.length)
    // ensure to pick at least one scope
    let scopes = faker.helpers.arrayElements(SCOPES, n_scopes)
    if (scopes.length === 0) {
      scopes = [faker.helpers.arrayElement(SCOPES)]
    }

    return {
      authorizationCodeExpiration,
      client_id: faker.internet.url(),
      code_challenge,
      code_challenge_method,
      code_verifier,
      me,
      iss: issuer,
      jti: nanoid(),
      redirect_uri: `${me}/auth/callback`,
      refreshTokenExpiration,
      scope: scopes.join(' ')
    }
  })

  const access_tokens = xs.map(accessToken)
  const authorization_codes = xs.map(authorizationCode)
  const client_apps = xs.map(clientApplication)
  const refresh_tokens = xs.map(refreshToken)
  const user_profiles = xs.map(userProfile)

  const { error: storage_error, value: storage } = defStorage({
    ajv: defAjv(),
    backend,
    env: environment as Environment
  })

  if (storage_error) {
    return exitOne(storage_error.message)
  }

  if (reset) {
    console.log(
      c.yellow(`resetting storage backend ${backend} [${environment}]`)
    )
    await unwrapP(storage.access_token.removeMany())
    await unwrapP(storage.authorization_code.removeMany())
    await unwrapP(storage.client_application.removeMany())
    await unwrapP(storage.refresh_token.removeMany())
    await unwrapP(storage.user_profile.removeMany())
  }

  await storeAll(access_tokens, {
    label: 'access tokens',
    storeOne: storage.access_token.storeOne
  })
  await storeAll(authorization_codes, {
    label: 'authorization codes',
    storeOne: storage.authorization_code.storeOne
  })
  await storeAll(client_apps, {
    label: 'client applications',
    storeOne: storage.client_application.storeOne
  })
  await storeAll(refresh_tokens, {
    label: 'refresh tokens',
    storeOne: storage.refresh_token.storeOne
  })
  await storeAll(user_profiles, {
    label: 'user profiles',
    storeOne: storage.user_profile.storeOne
  })

  if (argv.me) {
    const { error } = await storage.user_profile.storeOne({
      email: DEFAULT.PROFILE_EMAIL,
      me: DEFAULT.ME_AFTER_CANONICALIZATION,
      name: DEFAULT.PROFILE_NAME,
      url: DEFAULT.PROFILE_URL,
      photo: DEFAULT.PROFILE_PHOTO
    })
    if (error) {
      console.log(c.red(`could not store user profile about myself`))
    } else {
      console.log(c.green(`stored user profile about myself`))
    }
  }

  exitZero(`generated ${numSeeds} seeds for each category`)
}

run()
