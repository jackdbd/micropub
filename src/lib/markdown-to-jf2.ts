import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import matter from 'gray-matter'
import { htmlToMarkdown } from './html-to-markdown.js'
import { markdownToHtml } from './markdown-to-html.js'

export const markdownToJf2 = (md: string): Jf2 => {
  const parsed = matter(md)

  // Bookmarks, likes, reposts often have no text content.
  if (parsed.content) {
    const html = markdownToHtml(parsed.content)
    const value = htmlToMarkdown(html)
    return { ...parsed.data, content: { html, value } } as any as Jf2
  } else {
    return { ...parsed.data } as Jf2
  }
}
