import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import matter from 'gray-matter'
import { htmlToText } from 'html-to-text'
import { markdownToHtml } from './markdown-to-html.js'

export const markdownToJf2 = (md: string): Jf2 => {
  const parsed = matter(md)

  // Bookmarks, likes, reposts often have no text content.
  if (parsed.content) {
    const html = markdownToHtml(parsed.content)

    const text = htmlToText(html, {
      wordwrap: 130
    })
    return { ...parsed.data, content: { html, text } }
  } else {
    return { ...parsed.data }
  }
}
