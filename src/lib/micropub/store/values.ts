import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'

export interface BaseValueBlacklist {}

export interface BaseValueCleanup {}

export interface BaseValueCreate {}

export interface BaseValueDelete {}

export interface BaseValueGet {
  jf2: Jf2
}

export interface BaseValueIssue {}

export interface BaseValueIssuelist {}

export interface BaseValueReset {}

export interface BaseValueRevoke {}

export interface BaseValueRevokeAll {}

export interface BaseValueSyndicate {
  /**
   * The URL of the syndicated post (e.g. a URL on a social network).
   * Not all syndicators might return a URL (e.g. when we syndicate to a
   * Telegram chat/group, we don't get a URL back), so this field is optional.
   */
  syndication?: string

  /**
   * The UID of the syndicator.
   */
  uid: string
}

export interface BaseValueUndelete {}

export interface BaseValueUpdate {}

export interface BaseValueUpload {
  /**
   * The URL of the uploaded media.
   */
  url: string
}
