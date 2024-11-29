import { Static, Type } from '@sinclair/typebox'

/**
 * @see https://datatracker.ietf.org/doc/html/rfc3339#appendix-A
 */
export const dt_duration = Type.String({
  $id: 'dt-duration',
  description: 'Duration formatted according to RFC3339',
  format: 'duration'
})

export type DT_Duration = Static<typeof dt_duration>
