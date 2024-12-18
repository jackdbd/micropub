export const linkHeaderToLinkHref = (link: string) => {
  const splits = link.split(',').filter((s) => s.includes('indieauth-metadata'))

  if (splits.length < 1) {
    return {
      error: new Error(`Link has no rel="indieauth-metadata"`)
    }
  }

  if (splits.length > 1) {
    return {
      error: new Error(`Link has more than one rel="indieauth-metadata"`)
    }
  }

  const [uri_reference, ..._rest] = splits[0].split(';')

  if (!uri_reference) {
    return {
      error: new Error(`Link has rel="indieauth-metadata" but no URI reference`)
    }
  }

  const href = uri_reference.replace('<', '').replace('>', '').trim()

  return { value: href }
}
