export const NAME = '@jackdbd/fastify-authorization-endpoint'

export const DEFAULT = {
  // A maximum authorization code lifetime of 10 minutes is RECOMMENDED
  // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2
  AUTHORIZATION_CODE_EXPIRATION: '5 minutes',
  INCLUDE_ERROR_DESCRIPTION: false,
  LOG_PREFIX: 'authorization-endpoint ',
  REDIRECT_PATH_ON_SUBMIT: '/consent',
  REPORT_ALL_AJV_ERRORS: false
}
