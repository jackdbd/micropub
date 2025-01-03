export const NAME = '@jackdbd/fastify-token-endpoint'

export const DEFAULT = {
  ACCESS_TOKEN_EXPIRATION: '15 minutes',
  INCLUDE_ERROR_DESCRIPTION: false,
  LOG_PREFIX: 'token-endpoint ',
  REFRESH_TOKEN_EXPIRATION: '30 days',
  REPORT_ALL_AJV_ERRORS: false
}
