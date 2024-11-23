export interface GetResponseBody {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  content: string
  encoding: 'base64'
  _links: {
    self: string
    git: string
    html: string
  }
}
