import { applyToDefaults } from '@hapi/hoek'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { client_metadata } from '../../lib/indieauth/index.js'
import { throwIfDoesNotConform } from '../../lib/validators.js'
import { DEFAULT, NAME } from './constants.js'
import { defIdGet } from './routes/id-get.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  logoUri: DEFAULT.LOGO_URI,
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

const indieAuthClient: FastifyPluginCallback<Options> = (
  fastify,
  options,
  done
) => {
  const config = applyToDefaults(defaults, options) as Required<Options>

  const {
    clientId: client_id,
    clientName: client_name,
    clientUri: client_uri,
    logPrefix: log_prefix,
    logoUri: logo_uri,
    redirectUris: redirect_uris,
    reportAllAjvErrors: report_all_ajv_errors
  } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  throwIfDoesNotConform({ prefix: log_prefix }, ajv, options_schema, config)

  // client ID and redirect URI of the GitHub OAuth app used to authenticate users
  // The client must be registered in the IndieLogin database. We need ask Aaron Parecki for this registration.
  // See here:
  // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/app/Authenticate.php#L51
  // And here:
  // https://github.com/aaronpk/indielogin.com/issues/20

  // https://indielogin.com/api
  // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
  // https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/.env.example#L17

  // === PLUGINS ============================================================ //

  // === DECORATORS ========================================================= //

  // === HOOKS ============================================================== //
  fastify.addHook('onRoute', (routeOptions) => {
    fastify.log.debug(
      `${log_prefix}registered route ${routeOptions.method} ${routeOptions.url}`
    )
  })

  // === ROUTES ============================================================= //
  fastify.get(
    '/id',
    { schema: { response: { 200: client_metadata } } },
    defIdGet({
      client_id,
      client_name,
      client_uri,
      log_prefix,
      logo_uri,
      redirect_uris
    })
  )

  done()
}

export default fp(indieAuthClient, {
  fastify: '5.x',
  name: NAME,
  encapsulate: true
})
