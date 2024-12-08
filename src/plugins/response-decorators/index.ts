import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { errorResponse } from './error-response.js'
import { successResponse } from './success-response.js'
import { DEFAULT_LOG_PREFIX, NAME } from './constants.js'

interface Options {
  prefix?: string
}

const responseDecorators: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const opt = options ?? {}
  const prefix = opt.prefix ?? DEFAULT_LOG_PREFIX
  // TODO: config = options + defaults

  // === DECORATORS ========================================================= //
  fastify.decorateReply('errorResponse', errorResponse)
  fastify.log.debug(`${prefix}decorated fastify.reply with errorResponse`)

  fastify.decorateReply('successResponse', successResponse)
  fastify.log.debug(`${prefix}decorated fastify.reply with successResponse`)

  done()
}

export type { BaseErrorResponseBody } from './error-response.js'
export type { BaseSuccessResponseBody } from './success-response.js'

export default fp(responseDecorators, {
  fastify: '5.x',
  name: NAME,
  encapsulate: false
})
