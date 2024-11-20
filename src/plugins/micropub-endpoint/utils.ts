import matter from 'gray-matter'
import slugifyFn from 'slugify'
import yaml from 'yaml'
import type {
  H_entry,
  H_event,
  Mf2,
  Mf2Type,
  PostType
} from '../../lib/microformats2/index.js'
import { htmlToMarkdown, markdownToHtml } from '../../lib/markdown.js'
import type { ActionType } from './actions.js'

export interface PostRequestBody {
  access_token?: string
  action?: ActionType
  h?: PostType
  type?: Mf2Type[]
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

export const slugify = (h_entry: H_entry) => {
  let str = h_entry['mp-slug']
  if (str) {
    return str.toLowerCase()
  }

  if (h_entry['bookmark-of']) {
    str = `bookmark-${h_entry['bookmark-of']
      .replace(/^https?:\/\//, '')
      .replaceAll(/\./g, replacement_character)}`
  } else if (h_entry['like-of']) {
    str = `like-${h_entry['like-of']
      .replace(/^https?:\/\//, '')
      .replaceAll(/\./g, replacement_character)}`
  } else if (h_entry['repost-of']) {
    str = `repost-${h_entry['repost-of']
      .replace(/^https?:\/\//, '')
      .replaceAll(/\./g, replacement_character)}`
  } else if (h_entry.content) {
    if (typeof h_entry.content === 'string') {
      str = h_entry.content
    } else {
      // TODO: convert content.html to markdown and then slugify it?
      str = h_entry.content.value
    }
  } else {
    // If a Micropub client sent us a h-entry with no mp-slug, no content, no
    // like-of, no repost-of... what else can we do?
    str = 'no-content'
  }

  return slugifyFn(str, slugify_options)
}

export const slugifyEvent = (obj: any) => {
  let str: string = obj['mp-slug']
  if (str) {
    return str.toLowerCase()
  }

  if (obj.name) {
    str = obj.name
  } else if (obj.content) {
    if (typeof obj.content === 'string') {
      str = obj.content
    } else {
      // TODO: convert content.html to markdown and then slugify it?
      str = obj.content.value
    }
  } else {
    // If a Micropub client sent us a h-event with no mp-slug, no name and no
    // content... what else can we do?
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

export const postType = (request_body: any) => {
  if (request_body.h) {
    return request_body.h as PostType
  }

  if (request_body.type && request_body.type.length > 0) {
    const str = request_body.type.at(0) as Mf2Type
    return str.replace('h-', '') as PostType
  }

  // If no post type is specified, the default type SHOULD be used.
  // https://micropub.spec.indieweb.org/#create
  return 'entry' as PostType
}
