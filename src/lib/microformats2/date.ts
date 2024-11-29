import { Static, Type } from '@sinclair/typebox'

/**
 * The format of `published` and `updated` fields may change from [ISO8601] to
 * [RFC3339] or use [microformats2]'s more liberal date field.
 * @see https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
 */
export const date = Type.String({
  // $id: 'date-rfc-3339',
  format: 'date',
  description: 'Date formatted according to RFC3339'
})

/**
 * @see https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
 * @see https://ajv.js.org/packages/ajv-formats.html#formats
 */
export const date_time = Type.String({
  // $id: 'date-time-rfc-3339',
  format: 'date-time',
  description:
    'Date-time formatted according to RFC3339 (time-zone is mandatory)'
})

export const date_or_date_time = Type.Union([date, date_time])

export type DateTime = Static<typeof date_time>

export type DateOrDateTime = Static<typeof date_or_date_time>
