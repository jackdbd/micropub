import { Static, Type } from '@sinclair/typebox'
import { date, date_time } from './date.js'

export const dt_start = Type.Union([date, date_time], {
  $id: 'dt-start',
  description: 'Date or date-time when something starts (e.g. an h-event)'
})

export type DT_Start = Static<typeof dt_start>
