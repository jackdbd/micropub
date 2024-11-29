/**
 * JSON schemas for microformats2 vocabularies.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/microformats
 * @see https://microformats.org/wiki/microformats2
 * @see https://indieweb.org/microformats2
 */
export { date, date_time } from './date.js'

export { dt_accessed, type DT_Accessed } from './dt-accessed.js'
export { dt_anniversary, type DT_Anniversary } from './dt-anniversary.js'
export { dt_bday, type DT_Bday } from './dt-bday.js'
export { dt_duration, type DT_Duration } from './dt-duration.js'
export { dt_end, type DT_End } from './dt-end.js'
export { dt_published, type DT_Published } from './dt-published.js'
export { dt_reviewed, type DT_Reviewed } from './dt-reviewed.js'
export { dt_start, type DT_Start } from './dt-start.js'
export { dt_updated, type DT_Updated } from './dt-updated.js'

export { e_content, type E_Content } from './e-content.js'

export { h_adr, type H_Adr } from './h-adr.js'
export { h_card, type H_Card } from './h-card.js'
export { h_cite, type H_Cite } from './h-cite.js'
export { h_entry, type H_Entry } from './h-entry.js'
export { h_event, type H_Event } from './h-event.js'
export { h_geo, type H_Geo } from './h-geo.js'
export { h_item, type H_Item } from './h-item.js'
export { h_resume, type H_Resume } from './h-resume.js'

export { p_altitude, type P_Altitude } from './p-altitude.js'
export { p_author, type P_Author } from './p-author.js'
export { p_category, type P_Category } from './p-category.js'
export { p_content, type P_Content } from './p-content.js'
export { p_description, type P_Description } from './p-description.js'
export { p_geo, type P_Geo } from './p-geo.js'
export { p_latitude, type P_Latitude } from './p-latitude.js'
export { p_location, type P_Location } from './p-location.js'
export { p_longitude, type P_Longitude } from './p-longitude.js'
export { p_name, type P_Name } from './p-name.js'
export { p_publication, type P_Publication } from './p-publication.js'
export { p_rsvp, type P_RSVP } from './p-rsvp.js'
export { p_summary, type P_Summary } from './p-summary.js'

export { u_photo, type U_Photo } from './u-photo.js'
export { u_uid, type U_UID } from './u-uid.js'
export { u_url, type U_URL } from './u-url.js'
export { u_syndication, type U_Syndication } from './u-syndication.js'

export {
  content_type,
  html,
  lang,
  text,
  jf2_type
} from './jf2-reserved-properties.js'
export { jf2_feed_type } from './jf2-feed-reserved-properties.js'

// https://micropub.spec.indieweb.org/#examples-of-creating-objects
export type Jf2PostType = 'card' | 'cite' | 'entry' | 'event'
export type Mf2PostType = 'h-card' | 'h-cite' | 'h-entry' | 'h-event'

// It's probably not worth implementing h-review.
// https://microformats.org/wiki/h-review
