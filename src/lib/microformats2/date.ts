import { Static, Type } from '@sinclair/typebox'

/**
 * The format of `published` and `updated` fields may change from [ISO8601] to
 * [RFC3339] or use [microformats2]'s more liberal date field.
 * @see https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
 */
export const date = Type.String({
  format: 'date',
  description: 'Full-date according to RFC3339'
})

/**
 * @see https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
 * @see https://ajv.js.org/packages/ajv-formats.html#formats
 */
export const date_time = Type.String({
  format: 'date-time',
  description: 'Date-time (time-zone is mandatory)'
})

export type DateTime = Static<typeof date_time>
