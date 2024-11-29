import { Type } from '@sinclair/typebox'

export const date_time = Type.String({
  $id: 'date-time-rfc-3339',
  format: 'date-time',
  description:
    'Date-time formatted according to RFC3339 (time-zone is mandatory)'
})
