/**
 * Canonicalizes a URL.
 *
 * @see [URL Canonicalization - IndieAuth spec](https://indieauth.spec.indieweb.org/#x3-4-url-canonicalization)
 */
export const canonicalUrl = (str: string, base?: string) => {
  // str can be a domain, a path or a url.
  // base can be a domain or a url.
  // For ease of use, clients MAY allow users to enter just the host part of the
  // URL, in which case the client MUST turn that into a valid URL before
  // beginning the IndieAuth flow, by prepending either an http or https scheme
  // and appending the path /. For example, if the user enters example.com, the
  // client transforms it into http://example.com/ before beginning discovery.
  if (!base) {
    if (!str.includes('http://') && !str.includes('https://')) {
      return new URL(`https://${str.toLowerCase()}`).href
    } else {
      return new URL(str.toLowerCase()).href
    }
  }

  const base_href: string = canonicalUrl(base)
  return new URL(str.toLowerCase(), base_href).href
}
