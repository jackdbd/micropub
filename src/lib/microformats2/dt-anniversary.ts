import { Static, Type } from '@sinclair/typebox'
import { date, date_time } from './date.js'

export const dt_anniversary = Type.Union([date, date_time], {
  $id: 'dt-anniversary',
  description: 'Date or date-time of an anniversary'
})

export type DT_Anniversary = Static<typeof dt_anniversary>
