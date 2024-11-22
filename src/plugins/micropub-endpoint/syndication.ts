import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import Queue from 'better-queue'
// @ts-ignore-next-line
import MemoryStore from 'better-queue-memory'

interface Service {
  name: string
  url: string
  photo?: string
}

interface User {
  name: string
  url: string
  photo?: string
}

export interface SyndicateToItem {
  uid: string
  name: string
  service?: Service
  user?: User
}

const syndicateOne = (input: any) => {
  console.log(`syndicating`, input)
  const ms = 1500
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`syndicated: ${JSON.stringify(input)}`)
    }, ms)
  })
}

const queue = new Queue(
  async (job: any, done: () => void) => {
    const message = await syndicateOne(job)
    console.log(message)
    done()
  },
  { store: MemoryStore() }
)

export const syndicate = async (jf2: Jf2) => {
  const messages: string[] = []

  const mp_syndicate_to = jf2['mp-syndicate-to']

  if (mp_syndicate_to) {
    if (typeof mp_syndicate_to === 'string') {
      const syndication_target = mp_syndicate_to
      queue.push({ syndication_target }) // ticket
      messages.push(`pushed to syndication queue: ${syndication_target}`)
    } else if (Array.isArray(mp_syndicate_to)) {
      mp_syndicate_to.forEach((syndication_target) => {
        queue.push({ syndication_target }) // ticket
        messages.push(`pushed to syndication queue: ${syndication_target}`)
      })
    }
  }

  return messages
}
