import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  iso8601,
  rfc3339,
  unixTimestampInMs,
  unixTimestampInSeconds
} from '../../dist/lib/date.js'
import { date_time } from '../../dist/lib/microformats2/index.js'
import { defValidateMf2Functions } from './test_utils.js'

const { ajv } = defValidateMf2Functions()

describe('date_time', () => {
  it('cannot be without a time zone', () => {
    const valid = ajv.validate(date_time, '2013-06-30 18:00:00')
    assert(!valid)
  })

  it('cannot be with a time zone notation', () => {
    const valid = ajv.validate(date_time, '2013-06-30T18:00:00 Europe/Rome')
    assert(!valid)
  })

  it('can be with an offset notation', () => {
    const valid = ajv.validate(date_time, '2013-06-30 18:00:00+02:00')
    assert(valid)
  })

  it('can be ISO 8601', () => {
    const valid = ajv.validate(date_time, iso8601())
    assert(valid)
  })

  it('can be RFC 3339', () => {
    const valid = ajv.validate(date_time, rfc3339())
    assert(valid)
  })

  it('cannot be a UNIX timestamp (in ms)', () => {
    const valid = ajv.validate(date_time, unixTimestampInMs())
    assert(!valid)
  })

  it('cannot be a UNIX timestamp (in seconds)', () => {
    const valid = ajv.validate(date_time, unixTimestampInSeconds())
    assert(!valid)
  })
})
