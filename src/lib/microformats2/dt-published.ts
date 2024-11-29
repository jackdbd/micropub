import { Static, Type } from '@sinclair/typebox'
import { date, date_time } from './date.js'

export const dt_published = Type.Union([date, date_time], {
  $id: 'dt-published',
  description:
    'Date or date-time of when something was published or will be published (e.g. h-entry, h-recipe)'
})

export type DT_Published = Static<typeof dt_published>
