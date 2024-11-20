import type { Mf2 } from '../../lib/microformats2/index.js'
// import { mf2ToMarkdown, slugifyEvent } from './utils.js'

// TODO: add links to documentation
export interface Mf2JsonEventProperties {
  category?: string[]
  content?: string
  description?: string[]
  duration?: string[]
  end?: string[]
  location?: any
  'mp-slug'?: string[]
  'mp-syndicate-to'?: string[]
  name?: string[]
  start?: string[]
  summary?: string
  url?: string
}

export interface Mf2JsonEvent {
  type: ['h-event']
  properties: Mf2JsonEventProperties
}

export const getValue = (input: any, key: string) => {
  const val = input[key]

  if (!val) {
    return undefined
  }

  if (typeof val === 'string') {
    return val
  }

  if (Array.isArray(val) && val.length > 0) {
    return val.at(0) as string
  }
}

export const eventMf2JsonToObj = (props: Mf2JsonEventProperties) => {
  // TODO: convert location
  const obj = {
    ...props,
    description: getValue(props, 'description'),
    duration: getValue(props, 'duration'),
    end: getValue(props, 'end'),
    'mp-slug': getValue(props, 'mp-slug'),
    name: getValue(props, 'name'),
    start: getValue(props, 'start')
  }

  return obj as Mf2
}
