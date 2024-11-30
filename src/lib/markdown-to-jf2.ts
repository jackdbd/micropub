import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import matter from 'gray-matter'
import { htmlToText } from 'html-to-text'
import { markdownToHtml } from './markdown-to-html.js'

export const markdownToJf2 = (md: string): Jf2 => {
  const parsed = matter(md)

  // Bookmarks, likes, reposts often have no text content.
  if (parsed.content) {
    const html = markdownToHtml(parsed.content)
    // console.log('=== html ===', html)

    const text = htmlToText(html, {
      // The default behavior is to wrap links in square brackets. We can remove
      // the brackets (but keep the link) using this selector:
      // selectors: [{ selector: 'a', options: { linkBrackets: false } }],
      wordwrap: 130
    })
    // console.log('=== text ===', text)
    return { ...parsed.data, content: { html, text } }
  } else {
    return { ...parsed.data }
  }
}
