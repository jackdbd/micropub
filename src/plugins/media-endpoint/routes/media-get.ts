import type { RouteHandler } from 'fastify'
import { DeleteContentOrMedia } from '../../../lib/schemas/index.js'

interface Config {
  delete?: DeleteContentOrMedia
}

export const defMediaGet = (config: Config) => {
  const mediaGet: RouteHandler = async (_request, reply) => {
    // store capabilities
    const supports_delete = config.delete ? true : false
    const capabilities = { supports_upload: true, supports_delete }

    return reply.successResponse(200, {
      title: 'Media endpoint configuration',
      description: 'Configuration page for the media endpoint.',
      summary: 'Configuration for the Micropub media endpoint.',
      payload: { capabilities }
    })
  }

  return mediaGet
}
