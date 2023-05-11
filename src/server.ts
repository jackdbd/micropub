import { build } from './app.js'
import type { Level, Options } from './app.js'
import closeWithGrace from 'close-with-grace'

const opts: Options = {
  logger: { level: 'info', transport: undefined as any }
}

// We want to use pino-pretty only if there is a human watching this,
// otherwise we log as newline-delimited JSON.
if (process.stdout.isTTY) {
  opts.logger.transport = { target: 'pino-pretty' }
  opts.logger.level = (process.env.LOG_LEVEL as Level) || 'info'
}

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

const fastify = await build(opts)

const start = async () => {
  try {
    const address = await fastify.listen({ host, port })
    fastify.log.info(`server is now listening on ${address}`)
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
