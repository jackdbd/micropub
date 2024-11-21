import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import yaml from 'yaml'
import { htmlToMarkdown } from './html-to-markdown.js'
import { markdownToHtml } from './markdown-to-html.js'

export const jf2ToMarkdown = (jf2: Jf2) => {
  const { content, ...frontmatter } = jf2

  // Consider using this library for the frontmatter:
  // https://github.com/importantimport/fff
  const fm = `---\n${yaml.stringify(frontmatter)}---\n`

  let str: string | undefined
  if (jf2.content) {
    if (typeof jf2.content === 'string') {
      str = jf2.content
    } else {
      str = (jf2.content as any).html as string
    }
  }

  // Bookmarks, likes, reposts often have no text content. For them, we only
  // include the frontmatter.
  if (str) {
    const html = markdownToHtml(str)
    const md = htmlToMarkdown(html)
    return `${fm}\n${md}`
  } else {
    return fm
  }
}
