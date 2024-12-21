import { errorMessageFromJSONResponse } from '../oauth2/error-message-from-response.js'
import { canonicalUrl } from './url-canonicalization.js'
import type { ServerMetadata } from './schemas.js'

/**
 * Performs IndieAuth metadata discovery.
 *
 * IndieAuth metadata adopts OAuth 2.0 Authorization Server Metadata [RFC8414],
 * with the notable difference that discovery of the URL happens via the IndieAuth link relation rather than the
 * `.well-known` discovery method specified by RFC8414.
 *
 * @see [IndieAuth Server Metadata](https://indieauth.spec.indieweb.org/#indieauth-server-metadata)
 * @see [OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414)
 */
export const serverMetadata = async (metadata_endpoint: string) => {
  const url = canonicalUrl(metadata_endpoint)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    })
  } catch (err) {
    return { error: new Error(`Failed to fetch ${url}`) }
  }

  if (!response.ok) {
    const msg = await errorMessageFromJSONResponse(response)
    return { error: new Error(`Failed to fetch ${url}: ${msg}`) }
  }

  try {
    const metadata: ServerMetadata = await response.json()
    return { value: metadata }
  } catch (err) {
    return { error: new Error(`Failed to parse JSON response`) }
  }
}
