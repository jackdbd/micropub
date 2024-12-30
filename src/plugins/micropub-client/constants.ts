export const NAME = '@jackdbd/fastify-micropub-client'

export const DEFAULT = {
  AUTHENTICATION_START_PATH: '/auth/start',
  AUTHORIZATION_CALLBACK_PATH: '/auth/callback',
  CODE_VERIFIER_LENGTH: 128,
  EMAIL_AUTH_START_PATH: '/auth/email',
  EMAIL_AUTH_REDIRECT_PATH: '/auth/email/callback',
  GITHUB_AUTH_START_PATH: '/auth/github',
  GITHUB_AUTH_REDIRECT_PATH: '/auth/github/callback',
  GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_APP_CLIENT_ID!,
  GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_APP_CLIENT_SECRET!,
  GOOGLE_AUTH_START_PATH: '/auth/google',
  GOOGLE_AUTH_REDIRECT_PATH: '/auth/google/callback',
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
  INCLUDE_ERROR_DESCRIPTION: false,
  INDIEAUTH_START_PATH: '/auth/indieauth',
  INDIEAUTH_REDIRECT_PATH: '/auth/indieauth/callback',
  INDIEAUTH_CLIENT_ID: process.env.INDIEAUTH_CLIENT_ID!,
  // LINKEDIN_AUTH_START_PATH: '/auth/linkedin',
  // LINKEDIN_AUTH_REDIRECT_PATH: '/auth/linkedin/callback',
  // LINKEDIN_OAUTH_CLIENT_ID: process.env.LINKEDIN_OAUTH_CLIENT_ID!,
  // LINKEDIN_OAUTH_CLIENT_SECRET: process.env.LINKEDIN_OAUTH_CLIENT_SECRET!,
  LOG_PREFIX: 'micropub-client ',
  REPORT_ALL_AJV_ERRORS: false
}
