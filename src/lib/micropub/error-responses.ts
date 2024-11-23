import {
  FORBIDDEN,
  INSUFFICIENT_SCOPE,
  INVALID_REQUEST,
  INVALID_TOKEN,
  UNAUTHORIZED
} from '../http-error.js'

interface GenericConfig {
  error: string
  error_description: string
  include_error_description: boolean
}

const body = (config: GenericConfig) => {
  const { error, error_description, include_error_description } = config
  return include_error_description ? { error, error_description } : { error }
}

export interface Config {
  error_description: string
  include_error_description: boolean
}

export const invalidRequest = (config: Config) => {
  return {
    code: INVALID_REQUEST.code,
    body: body({ ...config, error: INVALID_REQUEST.error })
  }
}

export const invalidToken = (config: Config) => {
  return {
    code: INVALID_TOKEN.code,
    body: body({ ...config, error: INVALID_TOKEN.error })
  }
}

export const unauthorized = (config: Config) => {
  return {
    code: UNAUTHORIZED.code,
    body: body({ ...config, error: UNAUTHORIZED.error })
  }
}

export const forbidden = (config: Config) => {
  return {
    code: FORBIDDEN.code,
    body: body({ ...config, error: FORBIDDEN.error })
  }
}

export const insufficientScope = (config: Config) => {
  return {
    code: INSUFFICIENT_SCOPE.code,
    body: body({ ...config, error: INSUFFICIENT_SCOPE.error })
  }
}
