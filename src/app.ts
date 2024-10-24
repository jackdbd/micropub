import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import type { FastifyRequest } from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyView from '@fastify/view'
import formbody from '@fastify/formbody'
// @ts-ignore-next-line
import nunjucks from 'nunjucks'
import type { Environment } from 'nunjucks'
import youch from './plugins/youch/index.js'
import productionErrorHandler from './plugins/production-error-handler/index.js'
import micropub from './plugins/micropub/index.js'
import { tap } from './nunjucks/filters.js'
import { foo } from './nunjucks/globals.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type Level = 'debug' | 'info' | 'warn' | 'error'

export interface Options {
  logger?: { level?: Level; transport?: any }
}

interface AuthQuery {
  code: string
  me: string
  state: string
}

/**
 * Instantiates the Fastify app.
 */
export async function defFastify(options?: Options) {
  const fastify = Fastify(options)

  // plugin to parse x-www-form-urlencoded bodies
  // https://github.com/fastify/fastify-formbody
  fastify.register(formbody)

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public')
  })

  if (process.env.NODE_ENV === 'development') {
    fastify.register(youch, { preLines: 5 })
  } else {
    fastify.register(productionErrorHandler)
  }

  fastify.register(micropub, {
    // authorizationEndpoint: '',
    // tokenEndpoint: '',
    // Not sure if I have to include www in `me`
    me: 'https://www.giacomodebidda.com/'
    // me: 'https://giacomodebidda.com/'
  })

  fastify.register(fastifyView, {
    engine: { nunjucks },
    templates: [path.join(__dirname, 'templates')],
    options: {
      onConfigure: (env: Environment) => {
        env.addGlobal('foo', foo)
        env.addFilter('tap', tap)
        fastify.log.debug(`nunjucks environment configured`)
      }
    }
  })

  fastify.get('/', async (_request, reply) => {
    return reply.view('home.njk', {
      title: 'Home page',
      description: 'Home page',
      name: 'Giacomo'
    })
  })
  // https://indieauth.com/success?
  //code=uID6KOOOoEHvrRS9FEzZSQ%3D%3D.V1LmTMregkddKUwsoHcLnoovHZcQhaNAmq3z9JmIUMjUjzymk1wH1pRb_fnTJTeNU6iyaSgPdyt7JXXC8o7eoYZPXP6DuqNc8dnYEgdoUbrsO-hi2p6s9UwNKgjoGk927ZPi96_uXgH0aMPcLWzjurzp2kmWCOoDf-T7I-NH2RfGPxAX0-5cMd4uLUDphQCWGikkJVrTyGAraVxVWH2sT4qeXf7UgVDhKvwELjIcc25oKqBzozvsEpJz5gS7TkUuHYINcSJRJ4DF_CyaZcSh9BkDpSymrpTRJj6KMzQWhVWC6TNXaH8-l_Z_jZEHvz5yN_KIfTLKTBAYps7p3VTwVX6baJCb7kVVc46B9NFah970HIbFRJWCxWLGT4CuunUWR3K4Ff8lZgG5C_n9Pp0dwpJtIqBMy_8JDjAWW-fuYJKNG2E2bIisDd75TM8GVos1UMWcVp5iwheykhUc13BRjTcMv01KIPv27hcos0aX0NLfyR7qe69Yi2sxeIIInyDML0goMO0EU5dCyQECKS8dhs4DqRDVZteMNDqKeP6C5PeM.T5K8t2q-KWxniOT7
  // me=https%3A%2F%2Fgiacomodebidda.com%2F
  //s tate=jwiusuerujs

  fastify.get('/login', async (_request, reply) => {
    return reply.view('login.njk', {
      // authorization_endpoint: 'https://indielogin.com/auth',
      // client ID and redirect URI of the GitHub OAuth app used to authenticate users
      // The client must be registered in the IndieLogin database. We need ask Aaron Parecki for this registration.
      // See here:
      // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/app/Authenticate.php#L51
      // And here:
      // https://github.com/aaronpk/indielogin.com/issues/20
      // client_id: 'https://matsuri-demo-app-45eyyotfta-ey.a.run.app',
      // redirect_uri:
      //   'http://matsuri-demo-app-45eyyotfta-ey.a.run.app/auth/github',
      authorization_endpoint: 'https://indieauth.com/auth',
      client_id: 'https://indieauth.com',
      // redirect_uri: 'https://indieauth.com/success',
      redirect_uri: process.env.BASE_URL + '/callback',
      // https://indielogin.com/api
      // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
      // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/.env.example#L17
      state: 'jwiusuerujs',
      description: 'Login page',
      title: 'Login'
    })
  })

  fastify.get(
    '/callback',
    async (request: FastifyRequest<{ Querystring: AuthQuery }>, reply) => {
      const { code, me, state } = request.query

      request.log.warn(`TODO: verify that state is the one we sent: ${state}`)

      return reply.view('auth-success.njk', {
        description: 'Auth success page',
        title: 'Auth success',
        me,
        code
      })

      // return reply.send({
      //   message: 'got authorization code',
      //   code,
      //   me,
      //   state
      // })
    }
  )

  fastify.get('/error', async (_request, _reply) => {
    throw new Error('Some weird error')
  })

  fastify.get('/token', async (_request, reply) => {
    return reply.view('token.njk', {
      description: 'Token page',
      title: 'Token'
    })
  })

  return fastify
}
