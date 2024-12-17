import { ACCEPT, GITHUB_API_VERSION, GITHUB_TOKEN } from './defaults.js'

export interface Options {
  github_api_version?: string
  token?: string
}

export const defHeaders = (options?: Options) => {
  const opt = options ?? {}
  const api_version = opt.github_api_version ?? GITHUB_API_VERSION
  const token = opt.token ?? GITHUB_TOKEN

  if (!token) {
    throw new Error('GitHub token not set')
  }

  return {
    accept: ACCEPT,
    authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': api_version
  }
}
