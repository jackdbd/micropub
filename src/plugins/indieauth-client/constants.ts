export const NAME = '@jackdbd/fastify-indieauth-client'

export const DEFAULT = {
  AUTHENTICATION_START_PATH: '/auth/start',
  CODE_VERIFIER_LENGTH: 128,
  GITHUB_AUTHENTICATION_START_PATH: '/auth/github',
  GITHUB_AUTHENTICATION_CALLBACK_PATH: '/auth/github/callback',
  INCLUDE_ERROR_DESCRIPTION: false,
  INDIEAUTH_AUTHENTICATION_START_PATH: '/auth/indieauth',
  INDIEAUTH_AUTHENTICATION_CALLBACK_PATH: '/auth/callback',
  LOG_PREFIX: 'indieauth-client ',
  LOGO_URI: 'https://www.svgrepo.com/show/148626/test.svg',
  REPORT_ALL_AJV_ERRORS: false
}
