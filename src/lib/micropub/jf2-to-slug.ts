import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import slugifyFn from 'slugify'
// import { nowUTC } from './date.js'

const replacement_character = '-'

const slugify_options = {
  lower: true,
  replacement: replacement_character, // replace spaces with replacement character
  remove: /[*+~.·,()'"`´%!?¿:@\/]/g
}

/**
 * Creates a slug from a JF2 object.
 *
 * The Micropub server MAY or MAY NOT decide to respect the requested slug,
 * based on whether it would cause conflicts with other URLs on the site.
 *
 * Does this imply that this function should check the website, and so be async?
 * Could the caller fetch the website and see if an URL with the same slug
 * already exists?
 *
 * @see https://indieweb.org/Micropub-extensions#Slug
 */
export const jf2ToSlug = (jf2: Jf2) => {
  let str = jf2['mp-slug']
  if (str) {
    return str.toLowerCase()
  }

  // const yyyy_mm_dd = nowUTC().split('T')[0]
  // const prefix = `${yyyy_mm_dd}-`
  const prefix = ''

  if (jf2.name) {
    str = jf2.name
  } else if (jf2.summary) {
    str = jf2.summary
  } else if (jf2['bookmark-of']) {
    str = `${prefix}${jf2['bookmark-of']
      .replace(/^https?:\/\//, '')
      .replaceAll(/\./g, replacement_character)}`
  } else if (jf2['like-of']) {
    str = `${prefix}${jf2['like-of']
      .replace(/^https?:\/\//, '')
      .replaceAll(/\./g, replacement_character)}`
  } else if (jf2['repost-of']) {
    str = `${prefix}${jf2['repost-of']
      .replace(/^https?:\/\//, '')
      .replaceAll(/\./g, replacement_character)}`
  } else if (jf2.content) {
    if (typeof jf2.content === 'string') {
      // If the source of the post was written as string, we treat it as plain text.
      str = jf2.content
    } else {
      str = jf2.content.html || jf2.content.text
    }
  } else {
    // If we received a JF2 object that has no mp-slug, no content, no like-of,
    // no repost-of... what else can we do?
    str = 'no-content'
  }

  return slugifyFn(str, slugify_options)
}
