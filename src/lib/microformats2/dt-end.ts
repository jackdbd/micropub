import { Static, Type } from '@sinclair/typebox'
import { date, date_time } from './date.js'

export const dt_end = Type.Union([date, date_time], {
  $id: 'dt-end',
  description: 'Date or date-time when something ends (e.g. an h-event)'
})

export type DT_End = Static<typeof dt_end>
