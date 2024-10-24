import { defFastify } from './app.js'
import type { Level, Options } from './app.js'
import closeWithGrace from 'close-with-grace'

const config: Required<Options> = {
  logger: {
    level: (process.env.LOG_LEVEL as Level) || 'info',
    transport: undefined
  }
}

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

const fastify = await defFastify(config)

const start = async () => {
  try {
    await fastify.listen({ host, port })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

closeWithGrace({ delay: 10000 }, async ({ err }) => {
  if (err) {
    fastify.log.error({ err }, 'server closing due to error')
  } else {
    fastify.log.info('shutting down gracefully')
  }
  await fastify.close()
})
