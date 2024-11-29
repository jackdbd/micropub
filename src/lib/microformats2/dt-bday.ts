import { Static, Type } from '@sinclair/typebox'
import { date, date_time } from './date.js'

export const dt_bday = Type.Union([date, date_time], {
  $id: 'dt-bday',
  description: 'Date or date-time of a birthday'
})

export type DT_Bday = Static<typeof dt_bday>
