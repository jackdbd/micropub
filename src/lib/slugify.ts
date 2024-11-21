import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import slugifyFn from 'slugify'
import { nowUTC } from './date.js'

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

  const yyyy_mm_dd = nowUTC().split('T')[0]

  if (jf2.name) {
    str = jf2.name
  } else if (jf2.summary) {
    str = jf2.summary
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
