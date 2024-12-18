import type { RouteHandler } from 'fastify'

export interface Config {
  /**
   * URL where the authorization process starts.
   * Upon form submission, you will be redirected here.
   */
  auth_start_endpoint: string

  /**
   * IndieAuth client identifier. It MUST be a URL.
   *
   * @see [Client Identifier - IndieAuth](https://indieauth.spec.indieweb.org/#client-identifier)
   */
  client_id: string

  log_prefix: string
}

/**
 * Renders a login form to let the user authenticate using Web sign-in.
 *
 * @see [Web sign-in](https://indieweb.org/Web_sign-in)
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 */
export const defLogin = (config: Config) => {
  const { auth_start_endpoint, client_id, log_prefix } = config

  const login: RouteHandler = (request, reply) => {
    const access_token = request.session.get('access_token')

    if (access_token) {
      request.log.debug(
        `${log_prefix}access token found in session (you are already signed in)`
      )
      request.log.debug(`${log_prefix}redirect to /`)
      return reply.redirect('/')
    }

    request.log.debug(
      `${log_prefix}web-sign-in page. Upon form submission, you will be redirected to ${auth_start_endpoint}`
    )

    return reply.view('web-sign-in.njk', {
      auth_start_endpoint,
      client_id,
      description: 'Web sign-in page',
      title: 'Web sign-in'
    })
  }

  return login
}
