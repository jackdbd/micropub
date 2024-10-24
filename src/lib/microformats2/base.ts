import { Static, Type } from '@sinclair/typebox'

export const html_and_value = Type.Object({
  html: Type.String(),
  value: Type.String()
})

export const string_or_html_and_value = Type.Union([
  Type.String(),
  html_and_value
])
export type StringOrHtmlAndValue = Static<typeof string_or_html_and_value>

// full-date according to RFC3339
// https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
export const date = Type.String({ format: 'date' })

// time-zone is mandatory
// https://ajv.js.org/packages/ajv-formats.html#formats
// https://datatracker.ietf.org/doc/html/rfc3339#section-5.6
export const date_time = Type.String({ format: 'date-time' })
export type DateTime = Static<typeof date_time>

export const altitude = Type.Number({
  $id: 'altitude',
  title: 'Altitude',
  description: `Distance in metres from the nominal sea level along the tangent of the earth’s curve, i.e. the geoid height. For more information refer to the WGS84 specification and the geo URI scheme.`
})

export const latitude = Type.Number({
  $id: 'latitude',
  minimum: -90,
  maximum: 90,
  title: 'Latitude',
  description: `Coordinate that specifies the north–south position of a point on the surface of the Earth, in decimal degrees.`
})

export const longitude = Type.Number({
  $id: 'longitude',
  minimum: -180,
  maximum: 180,
  title: 'Longitude',
  description: `Coordinate that specifies the east–west position of a point on the surface of the Earth, in decimal degrees.`
})

/**
 * A Uniform Resource Identifier (URI) for geographic locations.
 * The numbers represent latitude, longitude and uncertainty (optional).
 *
 * See:
 * - https://geouri.org/
 * - https://en.wikipedia.org/wiki/Geo_URI_scheme
 * - https://regex101.com/r/k7bl7r/1
 */
export const geo_uri = Type.String({
  $id: 'geo-uri',
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
