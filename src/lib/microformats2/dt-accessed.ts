import { Static, Type } from '@sinclair/typebox'
import { date, date_time } from './date.js'

export const dt_accessed = Type.Union([date, date_time], {
  $id: 'dt-accessed',
  description:
    'Date or date-time of when something was accessed last time (e.g. to use in h-cite)'
})

export type DT_Accessed = Static<typeof dt_accessed>
