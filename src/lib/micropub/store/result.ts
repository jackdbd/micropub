export interface Failure<E> {
  error: E
  value?: undefined
}

export interface Success<V> {
  error?: undefined
  value: V
}

export type Result<E, V> = Failure<E> | Success<V>
