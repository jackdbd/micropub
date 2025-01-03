import { parser, type Content, type Node } from 'posthtml-parser'

const traverseNode = (node: Node, hrefs: string[]) => {
  if (typeof node === 'number') {
    return
  }

  if (typeof node === 'string') {
    return
  }

  if (node.tag === 'link' && node.attrs && node.attrs.rel === 'me') {
    const href = node.attrs.href
    if (typeof href !== 'string') {
      throw new Error(`Found a link whose href attribute is not a string`)
    }
    hrefs.push(href)
  }

  if (node.content) {
    traverseContent(node.content, hrefs)
  }
}

const traverseContent = (content: Content, hrefs: string[]) => {
  if (typeof content === 'number') {
    return
  }
  if (typeof content === 'string') {
    return
  }

  for (const nc of content) {
    const nn = Array.isArray(nc) ? nc : [nc]
    for (const n of nn) {
      traverseNode(n, hrefs)
    }
  }
}

const collectMeHrefs = (nodes: Node[]) => {
  const hrefs: string[] = []
  for (const node of nodes) {
    traverseNode(node, hrefs)
  }
  return hrefs
}

export const htmlToLinkHrefs = (html: string) => {
  // const rel = 'me'
  let nodes: Node[] = []
  try {
    nodes = parser(html)
  } catch (ex: any) {
    return { error: new Error(`Failed to parse HTML: ${ex.message}`) }
  }

  return { value: collectMeHrefs(nodes) }
}
