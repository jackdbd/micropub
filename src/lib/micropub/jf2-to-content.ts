import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import sanitizeHtml from 'sanitize-html'
import yaml from 'yaml'

// Drop `access_token` for security reasons.
// Drop `action`, `h`, `type` because there is no point in storing them.
// Drop `mp-slug` because it's a Micropub server command. We don't need to store it.
const DROP_FIELDS = new Set(['access_token', 'action', 'h', 'mp-slug', 'type'])

const cleanupJf2 = (input: Jf2) => {
  const output: Jf2 = Object.entries(input).reduce((acc, [key, value]) => {
    if (DROP_FIELDS.has(key)) {
      return acc
    } else {
      return { ...acc, [key]: value }
    }
  }, {})

  return output
}

export const jf2ToContentWithFrontmatter = (jf2: Jf2) => {
  const { content, ...frontmatter } = cleanupJf2(jf2)

  let fm: string | undefined
  if (Object.keys(frontmatter).length !== 0) {
    fm = `---\n${yaml.stringify(frontmatter)}---\n`
  }

  // Consider using this library for the frontmatter:
  // https://github.com/importantimport/fff

  if (content) {
    if (typeof content === 'string') {
      // If the source of the post was written as string, the Micropub endpoint
      // MUST return a string value for the content property, and the Micropub
      // client will treat the value as plain text.
      return fm ? `${fm}\n${content}` : content
    } else {
      // If the source of the post was written as HTML content, the Micropub
      // endpoint MUST return the content property as an object containing an
      // html property.
      const html = sanitizeHtml(content.html)
      return fm ? `${fm}\n${html}` : html
    }
  } else {
    // Bookmarks, likes, reposts often have no text content. For them, we only
    // include the frontmatter.
    return fm ? fm : ''
  }
}
