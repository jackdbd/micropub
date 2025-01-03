import { canonicalUrl } from '../url-canonicalization.js'
import { htmlToLinkHrefs } from './parse-html.js'

/**
 * Discovers all rel="me" links on the [user's profile URL](https://indieauth.spec.indieweb.org/#user-profile-url).
 */
export const relMeHrefs = async (me: string) => {
  const url = canonicalUrl(me)

  let response: Response
  try {
    response = await fetch(url, { method: 'GET' })
  } catch (ex: any) {
    return { error: new Error(`Failed to fetch ${url}: ${ex.message}`) }
  }

  if (!response.ok) {
    const details = `${response.statusText} (${response.status})`
    return { error: new Error(`Failed to fetch ${url}: ${details}`) }
  }

  const content_type = response.headers.get('content-type')

  if (content_type && content_type.includes('text/html')) {
    let html: string
    try {
      const res = await fetch(url, { method: 'GET' })
      html = await res.text()
    } catch (ex: any) {
      return { error: new Error(`Failed to fetch ${url}: ${ex.message}`) }
    }

    const { error, value } = htmlToLinkHrefs(html)
    if (error) {
      return { error }
    }
    return { value }
  }

  return {
    error: new Error(
      `URL ${url} is not served with Content-Type text/html (it is served with Content-Type: ${content_type})`
    )
  }
}
