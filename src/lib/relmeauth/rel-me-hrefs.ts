import { errorMessageFromJSONResponse } from '../oauth2/error-message-from-response.js'
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
  } catch (err) {
    return { error: new Error(`Failed to fetch ${url}`) }
  }

  if (!response.ok) {
    const msg = await errorMessageFromJSONResponse(response)
    return { error: new Error(`Failed to fetch ${url}: ${msg}`) }
  }

  const content_type = response.headers.get('content-type')

  if (content_type && content_type.includes('text/html')) {
    let html: string
    try {
      const res = await fetch(url, { method: 'GET' })
      html = await res.text()
    } catch (err: any) {
      return { error: new Error(`Failed to fetch ${url}: ${err.message}`) }
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
