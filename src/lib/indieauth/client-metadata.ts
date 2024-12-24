import { errorMessageFromJSONResponse } from '../oauth2/index.js'
import { canonicalUrl } from '../url-canonicalization/index.js'
import type { ClientMetadata } from './schemas.js'

/**
 * Fetches the IndieAuth client metadata.
 *
 * Clients SHOULD publish an OAuth Client ID Metadata Document (a JSON document)
 * at the client identifier URL. The authorization server SHOULD fetch the URL
 * to find more information about the client.
 *
 * @see [Client Metadata - IndieAuth spec](https://indieauth.spec.indieweb.org/#client-metadata)
 * @see [OAuth Client ID Metadata Document](https://datatracker.ietf.org/doc/html/draft-parecki-oauth-client-id-metadata-document)
 * @see [RFC7591 - OAuth 2.0 Dynamic Client Registration Protocol](https://datatracker.ietf.org/doc/html/rfc7591)
 */
export const clientMetadata = async (client_id: string) => {
  const url = canonicalUrl(client_id)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    })
  } catch (err) {
    return { error: new Error(`failed to fetch ${url}`) }
  }

  if (!response.ok) {
    const msg = await errorMessageFromJSONResponse(response)
    return { error: new Error(`failed to fetch ${url}: ${msg}`) }
  }

  try {
    const metadata: ClientMetadata = await response.json()
    return { value: metadata }
  } catch (err) {
    return { error: new Error(`failed to parse JSON response`) }
  }
}
