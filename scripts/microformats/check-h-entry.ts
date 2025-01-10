import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  dt_accessed,
  dt_published,
  dt_updated,
  e_content,
  h_adr,
  h_card,
  h_cite,
  h_entry,
  h_geo,
  p_altitude,
  p_author,
  p_geo,
  p_latitude,
  p_location,
  p_longitude,
  p_publication,
  p_rsvp,
  p_summary,
  u_url,
  u_syndication
} from '../../src/lib/microformats2/index.js'
import { check } from '../utils.js'

// https://ajv.js.org/packages/ajv-formats.html#formats
const ajv = addFormats(new Ajv({ allErrors: true }), [
  'date',
  'date-time',
  'email',
  'uri'
])

const main = () => {
  ajv.compile(dt_accessed)
  ajv.compile(dt_published)
  ajv.compile(dt_updated)
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
  ajv.compile(e_content)
  ajv.compile(h_geo)
  ajv.compile(h_adr)
  ajv.compile(h_card)
  ajv.compile(h_cite)
  const validate = ajv.compile(h_entry)

  check('h-entry (bare minimum)', {}, validate)

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
    'RSVP',
    {
      'in-reply-to':
        'https://aaronparecki.com/2014/09/13/7/indieweb-xoxo-breakfast',
      rsvp: 'maybe'
    },
    validate
  )
}

main()
