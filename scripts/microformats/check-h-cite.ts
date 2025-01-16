import { defAjv } from '../../src/ajv.js'
import {
  dt_accessed,
  dt_published,
  h_cite,
  p_author,
  p_content,
  p_name,
  p_publication,
  u_uid,
  u_url
} from '../../src/lib/microformats2/index.js'
import { check } from '../utils.js'

const ajv = defAjv({ allErrors: true })

const main = () => {
  ajv.compile(dt_accessed)
  ajv.compile(dt_published)
  ajv.compile(p_author)
  ajv.compile(p_content)
  ajv.compile(p_name)
  ajv.compile(p_publication)
  ajv.compile(u_uid)
  ajv.compile(u_url)
  const validate = ajv.compile(h_cite)

  check('h-cite (bare minimum)', { type: 'cite' }, validate)

  check(
    'h-cite with author, name and content',
    {
      type: 'cite',
      author: 'Isaac Newton',
      name: 'The Correspondence of Isaac Newton: Volume 5',
      content:
        'If I have seen further it is by standing on the shoulders of Giants.'
    },
    validate
  )
}

main()
