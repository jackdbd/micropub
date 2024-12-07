import { Jf2 } from '@paulrobertlloyd/mf2tojf2'

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

export interface Failure<E> {
  error: E
  value?: undefined
}

export interface Success<V> {
  error?: undefined
  value: V
}

export type Result<E, V> = Failure<E> | Success<V>

export interface Syndicator<
  V extends BaseValueSyndicate = BaseValueSyndicate,
  E extends Error = Error
> {
  uid: string
  syndicate: (url: string, jf2: Jf2) => Promise<Result<E, V>>
}
