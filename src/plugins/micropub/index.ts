import type {
  FastifyPluginCallback,
  FastifyPluginOptions,
  onRequestHookHandler
} from 'fastify'
import fp from 'fastify-plugin'
import stringify from 'fast-safe-stringify'
import * as jose from 'jose'
import { applyToDefaults } from '@hapi/hoek'
import type {
  H_card,
  H_cite,
  H_entry,
  H_event
} from '../../lib/microformats2/index.js'
import type { AccessTokenPayload } from '../interfaces.js'
import { micropub_get_request, micropub_post_request } from './schemas.js'
import { compileSchemasAndGetValidateFunctions } from './utils.js'
import {
  defAuthCallback,
  defEditor,
  defLogin,
  defSubmit,
  logout,
  postCreated
} from './routes.js'

const NAME = '@jackdbd/fastify-micropub'

// TODO: perform URL canonicalization as described in the IndieAuth spec.
// https://indieauth.spec.indieweb.org/#authorization
// https://developers.google.com/search/docs/crawling-indexing/canonicalization

export interface PluginOptions extends FastifyPluginOptions {
  /**
   * Micropub clients that want to post to a user's Micropub endpoint need to
   * obtain authorization from the user in order to get an access token.
   *
   * See: https://indieweb.org/obtaining-an-access-token
   * See: https://indieauth.com/setup
   */
  authorizationEndpoint: string

  authorizationCallbackRoute?: string

  baseUrl: string

  clientId: string

  codeChallengeMethod?: string

  codeVerifierLength?: number

  /**
   * URL of the user's website trying to authenticate using Web sign-in.
   *
   * See: https://indieweb.org/Web_sign-in
   */
  me: string

  micropubEndpoint: string

  /**
   * https://ajv.js.org/security.html#security-risks-of-trusted-schemas
   */
  reportAllAjvErrors?: boolean

  submitEndpoint: string

  /**
   * Micropub clients will be able to obtain an access token from this endpoint
   * after you have granted authorization. The Micropub client will then use
   * this access token when making requests to your Micropub endpoint.
   *
   * See: https://indieweb.org/token-endpoint
   * See: https://tokens.indieauth.com/
   */
  tokenEndpoint: string
}

const defaultOptions: Partial<PluginOptions> = {
  authorizationCallbackRoute: '/auth/callback',
  codeChallengeMethod: 'S256',
  codeVerifierLength: 128,
  reportAllAjvErrors: false
}

interface ValidateAccessTokenConfig {
  base_url: string
  me: string
}

const defValidateAccessToken = (config: ValidateAccessTokenConfig) => {
  const { base_url, me } = config

  const validateAccessToken: onRequestHookHandler = (request, reply, done) => {
    request.log.debug(
      `${NAME} validating access token from Authorization header`
    )

    // TODO: why is this the case? I can't remember if the micropub specs says
    // anything against non-POST requests.
    // if (request.method.toUpperCase() !== 'POST') {
    //   request.log.warn(
    //     `${NAME} request ID ${request.id} is a ${request.method} request, not a POST`
    //   )
    //   reply.code(415)
    //   return reply.send({
    //     ok: false,
    //     message: `${request.method} requests not allowed to this endpoint`
    //   })
    // }

    const auth = request.headers.authorization

    if (!auth) {
      request.log.warn(
        `${NAME} request ID ${request.id} has no 'Authorization' header`
      )
      reply.code(401)
      // return reply.send({ ok: false, message: `missing Authorization header` })
      return reply.view('error.njk', {
        base_url,
        description: 'Auth error page',
        message: `missing Authorization header`,
        title: 'Auth error'
      })
    }

    if (auth.indexOf('Bearer') === -1) {
      request.log.warn(
        `${NAME} request ID ${request.id} has no 'Bearer' in Authorization header`
      )
      reply.code(401)
      return reply.send({ ok: false, message: `access token is required` })
    }

    const splits = auth.split(' ')
    if (splits.length !== 2) {
      request.log.warn(
        `${NAME} request ID ${request.id} has no value for 'Bearer' in Authorization header`
      )
      reply.code(401)
      return reply.send({ ok: false, message: `access token is required` })
    }

    const jwt = splits[1]

    let claims: AccessTokenPayload
    try {
      claims = jose.decodeJwt(jwt) as unknown as AccessTokenPayload
    } catch (err) {
      request.log.warn(
        `${NAME} request ID ${request.id} sent invalid JWT: ${jwt}`
      )
      reply.code(401)
      return reply.send({ ok: false, message: `invalid JWT` })
    }

    request.log.info(
      `${NAME} access token claims ${stringify(claims, undefined, 2)}`
    )

    const scopes = claims.scope.split(' ')
    request.log.info(`${NAME} access token scopes: ${scopes.join(' ')}`)

    if (claims.me !== me) {
      reply.code(403)
      return reply.send({
        ok: false,
        message: `received access token whose 'me' claim is not ${me}`
      })
    }

    // if (claims.issued_by !== config.tokenEndpoint) {
    //   reply.code(403)
    //   reply.send({
    //     ok: false,
    //     message: `received access token issued by an unexpected token endpoint`
    //   })
    // }

    // Some token endpoint might issue a token that has `issued_at` in its
    // claims. Some other times we find `iat` in claims.
    // const date = new Date(claims.issued_at * 1000)
    const iat_utc = new Date(claims.iat * 1000).toUTCString()
    const exp_utc = new Date(claims.exp * 1000).toUTCString()

    // Tokens returned by Indiekit have no client ID?
    const client_id = 'Indiekit'
    // const client_id = claims.client_id

    request.log.info(
      `${NAME} access token issued by ${client_id} at ${claims.iat} (${iat_utc}), will expire at ${claims.exp} (${exp_utc})`
    )

    // const message = `access token for ${claims.me} issued by ${client_id} at ${iat_utc}, will expire at ${exp_utc}`

    // reply.send({
    //   ok: true,
    //   client_id,
    //   iat: claims.iat,
    //   exp: claims.exp,
    //   me: claims.me,
    //   message,
    //   scopes
    // })
    done()
  }

  return validateAccessToken
}

const fastifyMicropub: FastifyPluginCallback<PluginOptions> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(
    defaultOptions,
    options
  ) as Required<PluginOptions>
  fastify.log.debug(config, `${NAME} configuration`)

  const {
    validatePluginOptions,
    validateMicropubGetRequest,
    validateMicropubPostRequest
  } = compileSchemasAndGetValidateFunctions({
    allErrors: config.reportAllAjvErrors
  })
  fastify.log.debug(
    `${NAME} compiled JSON schemas and created validate functions`
  )

  validatePluginOptions(config)

  if (validatePluginOptions.errors) {
    const details = validatePluginOptions.errors.map((err) => {
      return `${err.instancePath.slice(1)} ${err.message}`
    })
    throw new Error(
      `${NAME} plugin registered using invalid options: ${details.join('; ')}`
    )
  }

  fastify.log.debug(`${NAME} validated its configuration`)

  const {
    authorizationCallbackRoute: auth_callback,
    authorizationEndpoint: authorization_endpoint,
    baseUrl: base_url,
    clientId: client_id,
    me,
    micropubEndpoint: micropub_endpoint,
    tokenEndpoint: token_endpoint
  } = config

  const redirect_uri = `${base_url}${auth_callback}`

  const validateAccessToken = defValidateAccessToken({ base_url, me })

  fastify.get(
    auth_callback,
    defAuthCallback({ client_id, prefix: NAME, redirect_uri, token_endpoint })
  )
  fastify.log.debug(`${NAME} route registered: GET ${auth_callback}`)

  fastify.get('/editor', defEditor({ submit_endpoint: config.submitEndpoint }))
  fastify.log.debug(`${NAME} route registered: GET /editor`)

  // authorization_endpoint: 'https://indielogin.com/auth',
  // client ID and redirect URI of the GitHub OAuth app used to authenticate users
  // The client must be registered in the IndieLogin database. We need ask Aaron Parecki for this registration.
  // See here:
  // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/app/Authenticate.php#L51
  // And here:
  // https://github.com/aaronpk/indielogin.com/issues/20

  // https://indielogin.com/api
  // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
  // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/.env.example#L17
  const login = defLogin({
    authorization_endpoint,
    client_id,
    code_challenge_method: config.codeChallengeMethod,
    len: config.codeVerifierLength,
    me,
    prefix: NAME,
    redirect_uri
  })

  fastify.get('/login', login)
  fastify.log.debug(`${NAME} route registered: GET /login`)

  fastify.get('/logout', logout)
  fastify.log.debug(`${NAME} route registered: GET /logout`)

  fastify.get(
    '/micropub',
    { onRequest: [], schema: micropub_get_request },
    async function (request, reply) {
      const log_entry = {
        message: `got GET request ${request.id} at micropub endpoint`,
        query: request.query,
        headers: request.headers,
        severity: 'INFO'
      }
      fastify.log.info(log_entry)

      const valid = validateMicropubGetRequest(request)

      if (!valid) {
        fastify.log.warn(`${NAME} received invalid micropub GET request`)
        reply.code(400)
        return reply.send({
          ok: false,
          message: `invalid micropub request`,
          errors: validateMicropubGetRequest.errors || []
        })
      }

      // const fake_syndicate_to = [
      //   {
      //     uid: 'https://twitter.com/aaronpk',
      //     name: 'twitter.com/aaronpk'
      //   },
      //   {
      //     uid: 'https://news.indieweb.org/en',
      //     name: 'IndieNews'
      //   }
      // ]

      fastify.log.debug(`${NAME} received valid micropub request`)

      // https://quill.p3k.io/docs/syndication
      // reply.send({
      //   message: 'TODO: implement /micropub?q=syndicate-to',
      //   'syndicate-to': fake_syndicate_to
      // })

      return reply.view('micropub.njk', {
        base_url,
        description: 'Micropub page',
        title: 'Micropub'
      })
    }
  )
  fastify.log.debug(`${NAME} route registered: GET /micropub`)

  fastify.post(
    '/micropub',
    { onRequest: [validateAccessToken], schema: micropub_post_request },
    async function (request, reply) {
      const valid = validateMicropubPostRequest(request)

      if (!valid) {
        fastify.log.warn(`${NAME} received invalid micropub POST request`)
        reply.code(400)
        return reply.send({
          ok: false,
          message: `invalid micropub request`,
          errors: validateMicropubPostRequest.errors || []
        })
      }

      // const req = request as MicropubRequest

      fastify.log.debug(`${NAME} received valid micropub request`)

      // TODO: JSON schema to TypeScript type/interface?
      // https://github.com/bcherny/json-schema-to-typescript
      const h = (request.body as any).h // microformats2

      fastify.log.debug(`${NAME} TODO: persist ${h}`)

      // TODO: validate the token's scope for the particular action the user want to do
      switch (h) {
        case 'card':
          const h_card = request.body as H_card
          reply.code(201)
          return reply.send(h_card)
        case 'cite':
          const h_cite = request.body as H_cite
          reply.code(201)
          return reply.send(h_cite)
        case 'entry':
          const h_entry = request.body as H_entry
          const content = h_entry['content']

          const permalink =
            h_entry['like-of'] ||
            h_entry['repost-of'] ||
            h_entry['in-reply-to'] ||
            h_entry.url

          fastify.log.debug({ content, permalink }, `${NAME} post created`)

          // Should we return a Location response header?
          // https://github.com/aaronpk/Quill/blob/dfb8c03a85318c9e670b8dacddb210025163501e/views/new-post.php#L406
          reply.header('Location', permalink)
          reply.code(201)

          return reply.send(h_entry)

        // return reply.view('post-created.njk', {
        //   description: 'Post created page',
        //   title: 'Post created'
        // })
        // const h_entry = request.body as H_entry
        // reply.send({ ...h_entry, url: 'https://example.com/1' })
        case 'event':
          const h_event = request.body as H_event
          reply.code(201)
          return reply.send(h_event)
        default:
          throw new Error(`h=${h} not implemented`)
      }

      // TODO: create, update, delete, undelete
      // https://github.com/barryf/vibrancy/tree/master/src/http/post-micropub/micropub

      // const result = await db.query(sql`
      //   UPDATE quotes SET likes = likes + 1 WHERE id=${request.params.id} RETURNING likes
      // `);

      // reply.header('X-foo', 'bar')
    }
  )
  fastify.log.debug(`${NAME} route registered: POST /micropub`)

  fastify.get('/post-created', postCreated)
  fastify.log.debug(`${NAME} route registered: GET /post-created`)

  fastify.post('/submit', defSubmit({ micropub_endpoint, prefix: NAME }))
  fastify.log.debug(`${NAME} route registered: POST /submit`)

  done()
}

/**
 * https://indieweb.org/Micropub#Handling_a_micropub_request
 */
export default fp(fastifyMicropub, {
  fastify: '5.x',
  name: NAME
})
