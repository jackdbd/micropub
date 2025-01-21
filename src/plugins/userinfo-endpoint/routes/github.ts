import { ServerError, UnauthorizedError } from '@jackdbd/oauth2-error-responses'

export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: 'User'
  site_admin: boolean
  name: string
  company: string
  blog: string
  location: string
  email: string
  hireable: boolean
  bio: string
  twitter_username: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface Config {
  access_token: string
}

export const githubUser = async (config: Config) => {
  const { access_token } = config

  // https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-a-user
  const url = 'https://api.github.com/user'

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  })

  if (!response.ok) {
    const error_description = `Error fetching GitHub profile.`
    return { error: new UnauthorizedError({ error_description }) }
  }

  try {
    const value: GitHubUser = await response.json()
    return { value }
  } catch (ex: any) {
    const original = ex.message
    const error_description = `Cannot parse the JSON response received from the GitHub API: ${original}.`
    // I don't think it's the client's fault if we couldn't parse the response
    // body, so we return a generic server error.
    return { error: new ServerError({ error_description }) }
  }
}
