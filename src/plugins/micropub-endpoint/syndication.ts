import Queue from 'better-queue'
// @ts-ignore-next-line
import MemoryStore from 'better-queue-memory'
import { H_entry } from '../../lib/microformats2'

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

export const syndicate = async (h_entry: H_entry) => {
  const messages: string[] = []
  if (h_entry['mp-syndicate-to']) {
    const splits = h_entry['mp-syndicate-to']
      .trim()
      .split(',')
      .map((s) => s.trim())

    splits.forEach((syndication_target) => {
      const ticket = queue.push({ syndication_target })
      messages.push(`pushed to syndication queue: ${syndication_target}`)
      console.log('in-memory queue ticket', ticket)
    })
  }
  return messages
}
