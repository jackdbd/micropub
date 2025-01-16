import { defAjv } from '../../src/ajv.js'
import {
  dt_accessed,
  dt_published,
  dt_updated,
  e_content,
  h_adr,
  h_card,
  h_cite,
  h_geo,
  p_altitude,
  p_author,
  p_geo,
  p_latitude,
  p_longitude,
  p_location,
  p_publication,
  p_rsvp,
  p_summary,
  u_url,
  u_syndication
} from '../../src/lib/microformats2/index.js'
import {
  access_token,
  action,
  date_time,
  mp_entry,
  mp_limit,
  mp_post_status,
  mp_slug,
  mp_syndicate_to,
  mp_visibility,
  photo
} from '../../src/lib/micropub/jf2/index.js'
import { check } from '../utils.js'

const ajv = defAjv({ allErrors: true })

const main = () => {
  ajv.compile(dt_accessed)
  ajv.compile(dt_published)
  ajv.compile(dt_updated)
  ajv.compile(e_content)
  ajv.compile(mp_slug)
  ajv.compile(mp_syndicate_to)
  ajv.compile(p_altitude)
  ajv.compile(p_author)
  ajv.compile(p_geo)
  ajv.compile(p_latitude)
  ajv.compile(p_location)
  ajv.compile(p_longitude)
  ajv.compile(p_publication)
  ajv.compile(p_rsvp)
  ajv.compile(p_summary)
  ajv.compile(u_url)
  ajv.compile(u_syndication)
  ajv.compile(h_geo)
  ajv.compile(h_adr)
  ajv.compile(h_card)
  ajv.compile(h_cite)

  ajv.compile(access_token)
  ajv.compile(action)
  ajv.compile(mp_limit)
  ajv.compile(mp_post_status)
  ajv.compile(mp_visibility)
  ajv.compile(photo)
  ajv.compile(date_time)

  const validate = ajv.compile(mp_entry)

  check('mp-entry (bare minimum)', {}, validate)

  check(
    'Plain text note',
    {
      content: 'this is a note'
    },
    validate
  )

  check(
    'HTML note with published and updated dates',
    {
      content: {
        html: '<p>This <b>is</b> a note</p>'
      },
      published: '2024-11-12T23:20:50.52Z',
      updated: '2024-11-29T23:20:50.52Z'
    },
    validate
  )

  check(
    'Bookmark with plain text content',
    {
      'bookmark-of': 'https://mxb.dev/blog/make-free-stuff/',
      content: 'Nice article!'
    },
    validate
  )

  check(
    'Like',
    {
      'like-of': 'http://othersite.example.com/permalink47'
    },
    validate
  )

  check(
    'Repost with HTML content',
    {
      'repost-of': 'http://othersite.example.com/permalink47',
      content: {
        html: '<p>You should read this <strong>awesome</strong> article</p>'
      }
    },
    validate
  )

  check(
    'A simple RSVP',
    {
      'in-reply-to':
        'https://aaronparecki.com/2014/09/13/7/indieweb-xoxo-breakfast',
      rsvp: 'maybe'
    },
    validate
  )

  check(
    'An RSVP with two syndication targets',
    {
      'in-reply-to':
        'https://aaronparecki.com/2014/09/13/7/indieweb-xoxo-breakfast',
      rsvp: 'maybe',
      'mp-syndicate-to': [
        'https://fosstodon.org/@jackdbd',
        'https://news.indieweb.org/en'
      ]
    },
    validate
  )

  check(
    'A note with a photo (URL)',
    {
      content: 'hello world',
      category: ['foo', 'bar'],
      photo: 'https://photos.example.com/592829482876343254.jpg'
    },
    validate
  )

  check(
    'A note with a photo (URL + alt text)',
    {
      content: 'hello world',
      category: ['foo', 'bar'],
      photo: {
        alt: 'A photo of something cool',
        value: 'https://photos.example.com/592829482876343254.jpg'
      }
    },
    validate
  )
}

main()
