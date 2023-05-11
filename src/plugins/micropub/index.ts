import {
  FastifyInstance,
  DoneFuncWithErrOrRes,
  FastifyRequest,
  FastifyReply
} from 'fastify'
import fp from 'fastify-plugin'
import * as jose from 'jose'
import { applyToDefaults } from '@hapi/hoek'
import { micropub_get_request, micropub_post_request } from './schemas.js'
// import { type H_entry } from './microformats2/h-entry.js'
import { compileSchemasAndGetValidateFunctions } from './utils.js'
import { H_event } from './microformats2/h-event.js'
import { H_card } from './microformats2/h-card.js'
import { H_cite } from './microformats2/h-cite.js'

declare module 'fastify' {
  export interface FastifyInstance {
    validateAccessToken(): void
  }
}

const EMOJI = '✒️'
const NAME = 'fastify-micropub'
const PREFIX = `[${EMOJI} ${NAME}]`

export interface PluginOptions {
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
  issued_by: string
  client_id: string
  issued_at: number
  scope: string
  nonce: number
}

/**
 * https://indieweb.org/Micropub#Handling_a_micropub_request
 */
const fastifyMicropub = (
  fastify: FastifyInstance,
  opts: PluginOptions,
  done: DoneFuncWithErrOrRes
) => {
  const config = applyToDefaults(
    defaultOptions,
    opts
  ) as Required<PluginOptions>

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

  fastify.decorate(
    'validateAccessToken',
    async (request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.debug(`${PREFIX} validate access token`)

      // if (request.method.toUpperCase() !== 'POST') {
      //   fastify.log.warn(
      //     `${PREFIX} request ID ${request.id} is a ${request.method} request, not a POST`
      //   )
      //   reply.code(415)
      //   reply.send({
      //     ok: false,
      //     message: `${request.method} requests not allowed to this endpoint`
      //   })
      // }

      const auth = request.headers.authorization

      if (!auth) {
        fastify.log.warn(
          `${PREFIX} request ID ${request.id} has no 'Authorization' header`
        )
        reply.code(401)
        reply.send({ ok: false, message: `missing Authorization header` })
      }

      if (auth.indexOf('Bearer') === -1) {
        fastify.log.warn(
          `${PREFIX} request ID ${request.id} has no 'Bearer' in Authorization header`
        )
        reply.code(401)
        reply.send({ ok: false, message: `access token is required` })
      }

      const jwt = auth.split(' ')[1]
      const claims = jose.decodeJwt(jwt) as unknown as DecodedToken
      fastify.log.debug(
        `${PREFIX} access token claims ${JSON.stringify(claims, null, 2)}`
      )

      // const scopes = claims.scope.split(' ')

      if (claims.me !== config.me) {
        reply.code(403)
        reply.send({
          ok: false,
          message: `received access token whose 'me' claim is not ${config.me}`
        })
      }

      if (claims.issued_by !== config.tokenEndpoint) {
        reply.code(403)
        reply.send({
          ok: false,
          message: `received access token issued by an unexpected token endpoint`
        })
      }

      // const date = new Date(claims.issued_at * 1000)

      // fastify.log.debug(
      //   `${PREFIX} access token issued by ${claims.client_id} at ${
      //     claims.issued_at
      //   } (${date.toISOString()} GMT)`
      // )

      // const message = `access token for ${claims.me} issued by ${claims.client_id} at ${claims.issued_at}`

      // reply.send({
      //   ok: true,
      //   client_id: claims.client_id,
      //   me: claims.me,
      //   message,
      //   scopes
      // })
    }
  )

  fastify.get(
    '/micropub',
    { onRequest: [fastify.validateAccessToken], schema: micropub_get_request },
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
        reply.send({
          ok: false,
          message: `invalid micropub request`,
          errors: validateMicropubGetRequest.errors || []
        })
      }

      const fake_syndicate_to = [
        {
          uid: 'https://twitter.com/aaronpk',
          name: 'twitter.com/aaronpk'
        },
        {
          uid: 'https://news.indieweb.org/en',
          name: 'IndieNews'
        }
      ]

      // fastify.log.debug(`${PREFIX} received valid micropub request`)

      // https://quill.p3k.io/docs/syndication
      reply.send({
        message: 'TODO: implement /micropub?q=syndicate-to',
        'syndicate-to': fake_syndicate_to
      })
    }
  )

  fastify.post(
    '/micropub',
    { onRequest: [fastify.validateAccessToken], schema: micropub_post_request },
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
        reply.send({
          ok: false,
          message: `invalid micropub request`,
          errors: validateMicropubPostRequest.errors || []
        })
      }

      // const req = request as MicropubRequest

      // fastify.log.debug(`=== ${PREFIX} received valid micropub request ===`)

      // TODO: JSON schema to TypeScript type/interface?
      // https://github.com/bcherny/json-schema-to-typescript
      const h = (request.body as any).h

      // fastify.log.debug(`${PREFIX} TODO: persist ${h}`)

      switch (h) {
        case 'card':
          const h_card = request.body as H_card
          reply.code(201)
          reply.send(h_card)
          break
        case 'cite':
          const h_cite = request.body as H_cite
          reply.code(201)
          reply.send(h_cite)
          break
        case 'entry':
          // permalink of the newly created post
          const permalink =
            'https://www.giacomodebidda.com/posts/inspect-container-images-with-dive/'
          // Must return a Location response header?
          // https://github.com/aaronpk/Quill/blob/dfb8c03a85318c9e670b8dacddb210025163501e/views/new-post.php#L406
          reply.header('Location', permalink)
          reply.code(201)
          // const h_entry = request.body as H_entry
          // reply.send({ ...h_entry, url: 'https://example.com/1' })
          return
        case 'event':
          const h_event = request.body as H_event
          reply.code(201)
          reply.send(h_event)
          break
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

  fastify.log.debug({
    message: `${PREFIX} registered`,
    severity: 'DEBUG'
  })
  done()
}

export default fp(fastifyMicropub, {
  fastify: '^4.x.x',
  name: NAME
})
