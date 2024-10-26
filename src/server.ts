import closeWithGrace from 'close-with-grace'
import { PinoLoggerOptions } from 'fastify/types/logger.js'
import { defFastify } from './app.js'

const host = process.env.HOST || '0.0.0.0'
// port should match the internal_port specified in fly.toml
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

const base_url = process.env.BASE_URL || `http://localhost:${port}`

const log_level = process.env.LOG_LEVEL || 'info'

const report_all_ajv_errors =
  process.env.NODE_ENV === 'production' ? false : true

const use_development_error_handler =
  process.env.NODE_ENV === 'development' ? true : false

const use_secure_flag_for_session_cookie =
  process.env.NODE_ENV === 'production' ? true : false

const logger: PinoLoggerOptions = { level: log_level, transport: undefined }

console.log('=== CONFIG (sensitive fields not shown) ===', {
  host,
  port,
  base_url,
  logger,
  report_all_ajv_errors,
  use_development_error_handler,
  use_secure_flag_for_session_cookie,
  NODE_ENV: process.env.NODE_ENV
})

const fastify = defFastify({
  base_url,
  logger,
  report_all_ajv_errors,
  use_development_error_handler,
  use_secure_flag_for_session_cookie
})

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
