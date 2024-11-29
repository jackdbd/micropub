import { Static, Type } from '@sinclair/typebox'

// TODO: or u-geo with a RFC 5870 geo: URL
// https://microformats.org/wiki/h-adr#Properties

/**
 * A Uniform Resource Identifier (URI) for geographic locations.
 * The numbers represent latitude, longitude and uncertainty (optional).
 *
 * See:
 * - https://geouri.org/
 * - https://en.wikipedia.org/wiki/Geo_URI_scheme
 * - https://regex101.com/r/k7bl7r/1
 */
export const p_geo = Type.String({
  $id: 'p-geo',
  pattern: 'geo:-?[0-9]{1,2}.[0-9]*,-?[0-9]{1,3}.?[0-9]*(;u=[0-9]{1,2})?',
  minLength: 8,
  // maxLength: 32,
  title: 'geo URI',
  description: `The geo URI scheme is a Uniform Resource Identifier (URI) scheme defined by the Internet Engineering Task Force's RFC 5870`,
  examples: ['geo:37.786971,-122.399677', 'geo:37.786971,-122.399677;u=35']
})

// I'm pretty sure this was working before, but now ajv cannot compile it.
// export const geo_uri = Type.RegExp(
//   /geo:-?[0-9]{1,2}\.[0-9]*,-?[0-9]{1,3}\.?[0-9]*(;u=[0-9]{1,2})?/,
//   {
//     minLength: 8,
//     title: 'geo URI',
//     description: `The geo URI scheme is a Uniform Resource Identifier (URI) scheme defined by the Internet Engineering Task Force's RFC 5870`,
//     examples: ['geo:37.786971,-122.399677', 'geo:37.786971,-122.399677;u=35']
//   }
// )

export type P_Geo = Static<typeof p_geo>
