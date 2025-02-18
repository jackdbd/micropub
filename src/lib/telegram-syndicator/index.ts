import type { JF2 } from '@jackdbd/micropub'
// import type { JF2 } from '@jackdbd/micropub/schemas' // This is not working
// import type { JF2 } from '@jackdbd/micropub/schemas/index'
// import type { JF2 } from '@jackdbd/micropub/schemas/jf2'
import { Syndicator } from '@jackdbd/micropub/syndicator'
import { send } from '@jackdbd/notifications/telegram'

export const EMOJI = {
  AUDIO: '🎵',
  BOOKMARK: '🔖', // 🔗
  CARD: '💳',
  CITE: '🗣️', // 🗣️ 💬
  CONTENT: '📝',
  ENTRY: '📝',
  EVENT: '🍻',
  LIKE: '❤️', // ❤️ 👍
  LOCATION: '📍',
  PHOTO: '📷',
  REPOST: '♻', // ♺ ♻ ♲ ♳ ♴ ♽
  VIDEO: '🎞️' // 🎥📹
}

export interface Config {
  chat_id: string
  token: string
  uid: string
}

export const defSyndicator = (config: Config): Syndicator => {
  const { chat_id, token, uid } = config

  const syndicate = async (url: string, jf2: JF2) => {
    const post_type = jf2.type || 'entry'

    let title: string
    switch (post_type) {
      case 'card': {
        title = `${EMOJI.CARD} <b>Micropub ${post_type}</b>`
        break
      }
      case 'cite': {
        title = `${EMOJI.CITE} <b>Micropub ${post_type}</b>`
        break
      }
      case 'event': {
        title = `${EMOJI.EVENT} <b>Micropub ${post_type}</b>`
        break
      }
      default: {
        title = `${EMOJI.ENTRY} <b>Micropub ${post_type}</b>`
      }
    }

    const lines = [title]

    // We put the photo first, so it's rendered by a Telegram client.
    // audio/photo/video
    // https://jf2.spec.indieweb.org/#multiple-urls
    if (jf2.photo) {
      console.log('=== jf2.photo ===')
      console.log(JSON.stringify(jf2.photo, null, 2))
      const xs = Array.isArray(jf2.photo) ? jf2.photo : [jf2.photo]
      xs.forEach((x) => {
        if (typeof x === 'string') {
          lines.push(`${EMOJI.PHOTO} <a href="${x}">Photo</a>`)
        } else {
          lines.push(`${EMOJI.PHOTO} <a href="${x.value}">${x.alt}</a>`)
        }
      })
    }

    if (jf2.audio) {
      console.log('=== jf2.audio ===')
      console.log(JSON.stringify(jf2.audio, null, 2))
      const xs = Array.isArray(jf2.audio) ? jf2.audio : [jf2.audio]
      xs.forEach((x) => {
        lines.push(`${EMOJI.AUDIO} <a href="${x}">${x}</a>`)
      })
    }

    if (jf2.video) {
      console.log('=== jf2.video ===')
      console.log(JSON.stringify(jf2.video, null, 2))
      const xs = Array.isArray(jf2.video) ? jf2.video : [jf2.video]
      xs.forEach((x) => {
        lines.push(`${EMOJI.VIDEO} <a href="${x}">${x}</a>`)
      })
    }

    if (jf2['bookmark-of']) {
      lines.push(`${EMOJI.BOOKMARK} ${jf2['bookmark-of']}`)
    }

    if (jf2['like-of']) {
      lines.push(`${EMOJI.LIKE} ${jf2['like-of']}`)
    }

    if (jf2['repost-of']) {
      lines.push(`${EMOJI.REPOST} ${jf2['repost-of']}`)
    }

    if (jf2.content) {
      if (typeof jf2.content === 'string') {
        if (jf2.content !== '') {
          // TODO: maybe allow the user to configure what to do in this case: throw / log / ignore / use a default
          console.warn('=== jf2.content is empty ===')
          console.log(JSON.stringify(jf2, null, 2))
        } else {
          lines.push(jf2.content)
        }
      } else {
        if (jf2.content.text) {
          if (jf2.content.text !== '') {
            lines.push(jf2.content.text)
          } else {
            console.warn('=== jf2.content.text is empty ===')
            console.log(JSON.stringify(jf2, null, 2))
          }
        } else if (jf2.content.html) {
          if (jf2.content.html !== '') {
            // TODO: sanitize the HTML and convert it to a format supported by
            // the medium where we syndicate this content to (e.g. simple HTML
            // if we are syndicating to Telegram, plain text for LinkedIn, etc).
            lines.push(jf2.content.html)
          } else {
            console.warn('=== jf2.content.html is empty ===')
            console.log(JSON.stringify(jf2, null, 2))
          }
        } else {
          console.warn('=== neither jf2.content.text nor jf2.content.html ===')
          console.log(JSON.stringify(jf2, null, 2))
        }
      }
    }

    // TODO: remove any when @jackdbd/micropub is updated
    if ((jf2 as any).location) {
      if (typeof (jf2 as any).location === 'string') {
        const lat_long_alt = (jf2 as any).location.split('geo:')[1]
        const lat_long = lat_long_alt.split(';')[0]
        const href = `https://www.google.com/maps?q=${lat_long}`
        lines.push(`${EMOJI.LOCATION} <a href="${href}">Location</a>`)
      } else {
        const { latitude, longitude } = (jf2 as any).location
        if (latitude && longitude) {
          const href = `https://www.google.com/maps?q=${latitude},${longitude}`
          lines.push(`${EMOJI.LOCATION} <a href="${href}">Location</a>`)
        }
      }
    }

    if (jf2.category) {
      let tags: string
      if (typeof jf2.category === 'string') {
        tags = jf2.category
      } else {
        tags = jf2.category.join(', ')
      }
      lines.push(`Tags: ${tags}`)
    }

    // Include other fields in the Telegram text? author, date, etc...

    lines.push(`Syndicated from <a>${url}</a>`)

    const text = lines.join('\n\n')

    try {
      const result = await send(
        { chat_id, token, text },
        { disable_notification: false, disable_web_page_preview: false }
      )

      if (result.delivered) {
        return {
          value: {
            // syndication: 'fake-telegram-url',
            summary: result.message,
            uid,
            payload: {
              delivered: result.delivered,
              delivered_at: result.delivered_at
            }
          }
        }
      } else {
        return {
          error: new Error(
            `Message not delivered to Telegram chat. Check that the Telegram Chat ID and the Bot token are correct.`
          )
        }
      }
    } catch (err: any) {
      return { error: new Error(err.message) }
    }
  }

  return { uid, syndicate }
}
