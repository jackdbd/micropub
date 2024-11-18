import matter from 'gray-matter'
import slugifyFn from 'slugify'
import yaml from 'yaml'
import type { H_entry } from '../../lib/microformats2/index.js'
import { htmlToMarkdown, markdownToHtml } from '../../lib/markdown.js'

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

  // if (h_entry['bookmark-of']) {
  //   str = `bookmark-${h_entry['bookmark-of']
  //     .replace(/^https?:\/\//, '')
  //     .replaceAll(/\./g, replacement_character)}`
  // }

  if (h_entry['like-of']) {
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

export const hEntryToMarkdown = (h_entry: H_entry) => {
  const { content, ...frontmatter } = h_entry

  let str: string
  if (h_entry.content) {
    if (typeof h_entry.content === 'string') {
      str = h_entry.content
    } else {
      str = h_entry.content.html
    }
  } else {
    // If a Micropub client sent us a h-entry with no mp-slug and no content...
    // ...what else can we do?
    str = 'no-content'
  }

  const html = markdownToHtml(str)
  const md = htmlToMarkdown(html)
  // console.log({ message: 'str => HTML => md', str, html, md })

  // Consider using this library for the frontmatter:
  // https://github.com/importantimport/fff
  const fm = `---\n${yaml.stringify(frontmatter)}---\n`
  return `${fm}\n${md}`
}

export const markdownToHEntry = (md: string): H_entry => {
  const parsed = matter(md)
  const html = markdownToHtml(parsed.content)
  const value = htmlToMarkdown(html)
  return { ...parsed.data, content: { html, value } }
}