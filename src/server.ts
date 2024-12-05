import closeWithGrace from 'close-with-grace'
import { defFastify } from './app.js'
import { defConfig } from './config.js'

const { error, value: config } = await defConfig()

if (error) {
  console.error(error)
  process.exit(1)
}

const fastify = await defFastify(config)

const start = async () => {
  try {
    await fastify.listen({ host: config.host, port: config.port })

    if (config.NODE_ENV === 'development') {
      // console.log('=== Fastify plugins ===')
      // console.log(fastify.printPlugins())
      // console.log('=== Fastify routes ===')
      // console.log(fastify.printRoutes({ includeHooks: true }))
    }
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
