import type {
  FastifyPluginCallback,
  FastifyPluginOptions,
  onRequestHookHandler
} from 'fastify'
import fp from 'fastify-plugin'
import * as jose from 'jose'
import { applyToDefaults } from '@hapi/hoek'
import type { H_card, H_cite, H_entry, H_event } from './microformats2/index.js'
import { micropub_get_request, micropub_post_request } from './schemas.js'
import { compileSchemasAndGetValidateFunctions } from './utils.js'

declare module 'fastify' {
  export interface FastifyInstance {
    validateAccessToken(): void
  }
}

const EMOJI = '✒️'
const NAME = '@jackdbd/fastify-micropub'
const PREFIX = `[${EMOJI} ${NAME}]`

export interface PluginOptions extends FastifyPluginOptions {
  /**
   * Micropub clients that want to post to a user's Micropub endpoint need to
   * obtain authorization from the user in order to get an access token.
   *
   * See: https://indieweb.org/obtaining-an-access-token
   * See: https://indieauth.com/setup
   */
  authorizationEndpoint?: string

  /**
   * URL of the user's website trying to authenticate using Web sign-in.
   *
   * See: https://indieweb.org/Web_sign-in
   */
  me: string

  /**
   * Micropub clients will be able to obtain an access token from this endpoint
   * after you have granted authorization. The Micropub client will then use
   * this access token when making requests to your Micropub endpoint.
   */
  tokenEndpoint?: string
}

const defaultOptions: Partial<PluginOptions> = {
  /**
   * By default, we delegate authorization to indieauth.com
   */
  authorizationEndpoint: 'https://indieauth.com/auth',
  /**
   * By default, we delegate token generation to the IndieAuth token endpoint.
   */
  tokenEndpoint: 'https://tokens.indieauth.com/token'
}

export interface DecodedToken {
  me: string
  // issued_by: string
  client_id: string
  exp: number // will expire at timestamp
  iat: number // issued at timestamp
  // issued_at: number
  scope: string
  nonce: number
}

const defValidateAccessToken = (config: Required<PluginOptions>) => {
  const validateAccessToken: onRequestHookHandler = (request, reply, done) => {
    request.log.debug(`${PREFIX} validate access token`)

    if (request.method.toUpperCase() !== 'POST') {
      request.log.warn(
        `${PREFIX} request ID ${request.id} is a ${request.method} request, not a POST`
      )
      reply.code(415)
      return reply.send({
        ok: false,
        message: `${request.method} requests not allowed to this endpoint`
      })
    }

    const auth = request.headers.authorization

    if (!auth) {
      request.log.warn(
        `${PREFIX} request ID ${request.id} has no 'Authorization' header`
      )
      reply.code(401)
      return reply.send({ ok: false, message: `missing Authorization header` })
    }

    if (auth.indexOf('Bearer') === -1) {
      request.log.warn(
        `${PREFIX} request ID ${request.id} has no 'Bearer' in Authorization header`
      )
      reply.code(401)
      return reply.send({ ok: false, message: `access token is required` })
    }

    const splits = auth.split(' ')
    if (splits.length !== 2) {
      request.log.warn(
        `${PREFIX} request ID ${request.id} has no value for 'Bearer' in Authorization header`
      )
      reply.code(401)
      return reply.send({ ok: false, message: `access token is required` })
    }

    const jwt = splits[1]

    let claims: DecodedToken
    try {
      claims = jose.decodeJwt(jwt) as unknown as DecodedToken
    } catch (err) {
      request.log.warn(
        `${PREFIX} request ID ${request.id} sent invalid JWT: ${jwt}`
      )
      reply.code(401)
      return reply.send({ ok: false, message: `invalid JWT` })
    }

    request.log.info(
      `${PREFIX} access token claims ${JSON.stringify(claims, null, 2)}`
    )

    const scopes = claims.scope.split(' ')
    request.log.info(`${PREFIX} access token scopes ${scopes.join(' ')}`)

    if (claims.me !== config.me) {
      reply.code(403)
      return reply.send({
        ok: false,
        message: `received access token whose 'me' claim is not ${config.me}`
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
      `${PREFIX} access token issued by ${client_id} at ${claims.iat} (${iat_utc}), will expire at ${claims.exp} (${exp_utc})`
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

  fastify.log.debug(`${PREFIX} config ${JSON.stringify(config, null, 2)}`)
  fastify.log.debug(`${PREFIX} compile schemas and create validate functions`)

  const {
    validatePluginOptions,
    validateMicropubGetRequest,
    validateMicropubPostRequest
  } = compileSchemasAndGetValidateFunctions()

  validatePluginOptions(config)

  if (validatePluginOptions.errors) {
    const details = validatePluginOptions.errors.map((err) => {
      return `${err.instancePath.slice(1)} ${err.message}`
    })
    throw new Error(
      `${PREFIX} plugin registered using invalid options: ${details.join('; ')}`
    )
  }

  fastify.log.debug(
    `${PREFIX} validated config ${JSON.stringify(config, null, 2)}`
  )

  const validateAccessToken = defValidateAccessToken(config)

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
        fastify.log.warn(`${PREFIX} received invalid micropub GET request`)
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

      fastify.log.debug(`${PREFIX} received valid micropub request`)

      // https://quill.p3k.io/docs/syndication
      // reply.send({
      //   message: 'TODO: implement /micropub?q=syndicate-to',
      //   'syndicate-to': fake_syndicate_to
      // })

      return reply.view('micropub.njk', {
        description: 'Micropub page',
        title: 'Micropub'
      })
    }
  )

  fastify.post(
    '/micropub',
    { onRequest: [validateAccessToken], schema: micropub_post_request },
    async function (request, reply) {
      const log_entry = {
        message: `got POST request ${request.id} at micropub endpoint`,
        body: request.body,
        headers: request.headers,
        severity: 'INFO'
      }
      fastify.log.info(log_entry)

      const valid = validateMicropubPostRequest(request)

      if (!valid) {
        fastify.log.warn(`${PREFIX} received invalid micropub POST request`)
        reply.code(400)
        return reply.send({
          ok: false,
          message: `invalid micropub request`,
          errors: validateMicropubPostRequest.errors || []
        })
      }

      // const req = request as MicropubRequest

      fastify.log.debug(`=== ${PREFIX} received valid micropub request ===`)

      // TODO: JSON schema to TypeScript type/interface?
      // https://github.com/bcherny/json-schema-to-typescript
      const h = (request.body as any).h // microformats2

      fastify.log.debug(`${PREFIX} TODO: persist ${h}`)

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
          // permalink of the newly created post
          const permalink =
            h_entry['like-of'] ||
            h_entry['repost-of'] ||
            h_entry['in-reply-to'] ||
            h_entry.url
          // Must return a Location response header?
          // https://github.com/aaronpk/Quill/blob/dfb8c03a85318c9e670b8dacddb210025163501e/views/new-post.php#L406
          reply.header('Location', permalink)
          return reply.code(201)
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

  fastify.log.info(`${PREFIX} registered`)
  done()
}

/**
 * https://indieweb.org/Micropub#Handling_a_micropub_request
 */
export default fp(fastifyMicropub, {
  fastify: '>=4.0.0 <6.0.0',
  name: NAME
})
