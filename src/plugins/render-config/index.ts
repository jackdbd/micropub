import { applyToDefaults } from '@hapi/hoek'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { defConfigGet } from './routes/config-get.js'

interface Options {
  logPrefix?: string
  pluginOptions?: any
  route?: string
  exclude?: string[]
}

const defaults: Partial<Options> = {
  logPrefix: 'render-config '
}

const renderConfig: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const { pluginOptions, route, exclude } = config

  fastify.get(route, defConfigGet({ config: pluginOptions, exclude }))

  done()
}

export default fp(renderConfig, {
  fastify: '5.x',
  name: 'render-config',
  encapsulate: true
})
