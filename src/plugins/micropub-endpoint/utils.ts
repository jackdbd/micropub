import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import matter from 'gray-matter'
import slugifyFn from 'slugify'
import yaml from 'yaml'
import type {
  Jf2PostType,
  Mf2,
  Mf2PostType
} from '../../lib/microformats2/index.js'
import { htmlToMarkdown, markdownToHtml } from '../../lib/markdown.js'
import type { ActionType } from './actions.js'

export interface PostRequestBody {
  access_token?: string
  action?: ActionType
  h?: Jf2PostType
  type?: Jf2PostType | Mf2PostType[]
  url?: string
}

export const utf8ToBase64 = (str: string) => {
  return Buffer.from(str, 'utf-8').toString('base64')
}

export const base64ToUtf8 = (str: string) => {
  return Buffer.from(str, 'base64').toString('utf-8')
}

const replacement_character = '-'

const slugify_options = {
  lower: true,
  replacement: replacement_character, // replace spaces with replacement character
  remove: /[*+~.·,()'"`´%!?¿:@\/]/g
}

export const slugify = (jf2: Jf2) => {
  let str = jf2['mp-slug']
  if (str) {
    return str.toLowerCase()
  }

  const yyyy_mm_dd = new Date().toISOString().split('T')[0]

  if (jf2.name) {
    str = jf2.name
  } else if (jf2['bookmark-of']) {
    str = `${yyyy_mm_dd}-${jf2['bookmark-of']
      .replace(/^https?:\/\//, '')
      .replaceAll(/\./g, replacement_character)}`
  } else if (jf2['like-of']) {
    str = `${yyyy_mm_dd}-${jf2['like-of']
      .replace(/^https?:\/\//, '')
      .replaceAll(/\./g, replacement_character)}`
  } else if (jf2['repost-of']) {
    str = `${yyyy_mm_dd}-${jf2['repost-of']
      .replace(/^https?:\/\//, '')
      .replaceAll(/\./g, replacement_character)}`
  } else if (jf2.content) {
    if (typeof jf2.content === 'string') {
      str = jf2.content
    } else {
      // TODO: convert content.html to markdown and then slugify it?
      str = (jf2.content as any).value as string
    }
  } else {
    // If we received a JF2 object that has no mp-slug, no content, no like-of,
    // no repost-of... what else can we do?
    str = 'no-content'
  }

  return slugifyFn(str, slugify_options)
}

export const mf2ToMarkdown = (mf2: Mf2) => {
  const { content, ...frontmatter } = mf2

  // Consider using this library for the frontmatter:
  // https://github.com/importantimport/fff
  const fm = `---\n${yaml.stringify(frontmatter)}---\n`

  let str: string | undefined
  if (mf2.content) {
    if (typeof mf2.content === 'string') {
      str = mf2.content
    } else {
      str = mf2.content.html
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

export const markdownToMf2 = (md: string): Mf2 => {
  const parsed = matter(md)

  // Bookmarks, likes, reposts often have no text content.
  if (parsed.content) {
    const html = markdownToHtml(parsed.content)
    const value = htmlToMarkdown(html)
    return { ...parsed.data, content: { html, value } }
  } else {
    return { ...parsed.data }
  }
}
