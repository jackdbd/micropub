import type { RouteHandler } from 'fastify'

export interface Options {
  log_prefix?: string
}

// See how it's done here:
// https://github.com/aaronpk/indielogin.com/blob/35c8aa0ae627517d9c9a9578b901740736ded428/app/Provider/Email.php
// SendGrid, Mailgun, Postmark, Resend, AWS SES, Nodemailer.

export const defAuthorizationEmailStart = (options?: Options) => {
  const opt = options ?? ({} as Options)
  const log_prefix = opt.log_prefix ?? 'auth-email-start '

  const authorizationEmailStart: RouteHandler = (request, reply) => {
    request.log.debug(`${log_prefix}request.query:`, request.query)
    return reply.send({
      message: 'TODO: implement email flow'
    })
  }

  return authorizationEmailStart
}
