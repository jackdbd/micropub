import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { errorResponse } from './error-response.js'
import { successResponse } from './success-response.js'
import { NAME } from './constants.js'

interface Options {}

const responseDecorators: FastifyPluginCallback<Options> = (
  fastify,
  _options,
  done
) => {
  // TODO: config = options + defaults

  // === DECORATORS ========================================================= //
  const prefix_decorators = `${NAME}/decorators `
  fastify.decorateReply('errorResponse', errorResponse)
  fastify.log.debug(`${prefix_decorators}decorateReply: errorResponse`)

  fastify.decorateReply('successResponse', successResponse)
  fastify.log.debug(`${prefix_decorators}decorateReply: successResponse`)

  done()
}

export type { BaseErrorResponseBody } from './error-response.js'
export type { BaseSuccessResponseBody } from './success-response.js'

export default fp(responseDecorators, {
  fastify: '5.x',
  name: NAME,
  encapsulate: false
})
