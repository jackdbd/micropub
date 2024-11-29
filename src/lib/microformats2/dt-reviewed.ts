import { Static, Type } from '@sinclair/typebox'
import { date, date_time } from './date.js'

export const dt_reviewed = Type.Union([date, date_time], {
  $id: 'dt-reviewed',
  description:
    'Date or date-time of when something was reviewed or will be reviewed (e.g. h-review)'
})

export type DT_Reviewed = Static<typeof dt_reviewed>
