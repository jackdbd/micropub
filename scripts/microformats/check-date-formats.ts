import Ajv from 'ajv'
import dayjs from 'dayjs'
import addFormats from 'ajv-formats'
import {
  date_time as date_time_schema,
  date_or_date_time as date_or_date_time_schema
} from '../../src/lib/microformats2/date.js'
import { check } from '../utils.js'

// https://ajv.js.org/packages/ajv-formats.html#formats
const ajv = addFormats(new Ajv({ allErrors: true }), ['date', 'date-time'])

const microformats2 = (date: dayjs.Dayjs) => {
  console.log('\n=== dates for Microformats2 ===')
  const validate = ajv.compile(date_or_date_time_schema)

  const unix_timestamp_in_seconds = date.unix()
  const unix_timestamp_in_ms = date.valueOf()
  const iso_8601 = date.toISOString()
  const rfc_3339 = date.format('YYYY-MM-DDTHH:mm:ssZ')
  const yyyy_mm_dd = date.format('YYYY-MM-DD')

  // These should be valid
  check('ISO 8601', iso_8601, validate)
  check('RFC 3339', rfc_3339, validate)
  check('YYYY-MM-DD', yyyy_mm_dd, validate)

  // These should be invalid
  check('UNIX timestamp (sec, num)', unix_timestamp_in_seconds, validate)
  check('UNIX timestamp (sec, str)', `${unix_timestamp_in_seconds}`, validate)
  check('UNIX timestamp (ms, num)', unix_timestamp_in_ms, validate)
  check('UNIX timestamp (ms, str)', `${unix_timestamp_in_ms}`, validate)
}

const jf2Feed = (date: dayjs.Dayjs) => {
  console.log('\n=== dates for JF2 Feed ===')
  const validate = ajv.compile(date_time_schema)

  // JF2 feed requires the `published` and `updated` fields to be formatted
  // according to ISO 8601. However, the spec also mentions that the format of
  // these fields may change from ISO 8601 to RFC 3339 or use microformats2's
  // more liberal date field.
  // https://www.w3.org/TR/jf2/#jf2feed_required_fields

  const unix_timestamp_in_seconds = date.unix()
  const unix_timestamp_in_ms = date.valueOf()
  console.log('UNIX timestamp (seconds)', unix_timestamp_in_seconds)
  console.log('UNIX timestamp (ms)', unix_timestamp_in_ms)

  // const utc_offset = date.utcOffset()
  // console.log('UTC offset', utc_offset)

  // https://en.wikipedia.org/wiki/ISO_8601
  const iso_8601 = date.toISOString()
  // console.log('ISO 8601', iso_8601)

  // https://datatracker.ietf.org/doc/html/rfc3339
  const rfc_3339 = date.format('YYYY-MM-DDTHH:mm:ssZ')
  // console.log('RFC 3339', rfc_3339)

  const yyyy_mm_dd = date.format('YYYY-MM-DD')

  // These should be valid
  check('ISO 8601', iso_8601, validate)
  check('RFC 3339', rfc_3339, validate)

  // These should be invalid
  check('YYYY-MM-DD', yyyy_mm_dd, validate)
  check('UNIX timestamp (sec, num)', unix_timestamp_in_seconds, validate)
  check('UNIX timestamp (sec, str)', `${unix_timestamp_in_seconds}`, validate)
  check('UNIX timestamp (ms, num)', unix_timestamp_in_ms, validate)
  check('UNIX timestamp (ms, str)', `${unix_timestamp_in_ms}`, validate)
}

const main = () => {
  // const date = dayjs('2018-12-31 13:59:10')
  const date = dayjs()
  microformats2(date)
  jf2Feed(date)
}

main()
