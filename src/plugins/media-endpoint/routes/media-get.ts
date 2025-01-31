import type { DeleteContentOrMedia } from '@jackdbd/fastify-micropub-endpoint'
import type { RouteHandler } from 'fastify'

interface Config {
  delete?: DeleteContentOrMedia
}

export const defMediaGet = (config: Config) => {
  const mediaGet: RouteHandler = async (_request, reply) => {
    // store capabilities
    const supports_delete = config.delete ? true : false
    const capabilities = { supports_upload: true, supports_delete }

    return reply.code(200).send({ capabilities })
  }

  return mediaGet
}
