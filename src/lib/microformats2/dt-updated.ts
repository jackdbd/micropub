import { Static, Type } from '@sinclair/typebox'
import { date, date_time } from './date.js'

export const dt_updated = Type.Union([date, date_time], {
  $id: 'dt-updated',
  description:
    'Date or date-time of when something was updated or will be updated (e.g. h-entry)'
})

export type DT_Updated = Static<typeof dt_updated>
