import type { RouteHandler } from 'fastify'

export interface Config {
  authentication_start_path: string
  log_prefix: string
}

/**
 * Renders a login form to let the user authenticate using [Web sign-in](https://indieweb.org/Web_sign-in).
 */
export const defLogin = (config: Config) => {
  const { authentication_start_path, log_prefix } = config

  const login: RouteHandler = (request, reply) => {
    // const access_token = request.session.get('access_token')

    // if (access_token) {
    //   request.log.debug(
    //     `${log_prefix}access token found in session (you are already signed in)`
    //   )
    //   request.log.debug(`${log_prefix}redirect to /`)
    //   return reply.redirect('/')
    // }

    request.log.debug(
      `${log_prefix}web sign-in page. Upon form submission, you will be redirected to ${authentication_start_path}`
    )

    return reply.view('web-sign-in.njk', {
      authentication_start_path,
      description: 'Web sign-in page',
      title: 'Web sign-in'
    })
  }

  return login
}
