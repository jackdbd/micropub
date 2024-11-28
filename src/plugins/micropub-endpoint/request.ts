import type { Jf2, Mf2 } from '@paulrobertlloyd/mf2tojf2'
// import type { Jf2PostType, Mf2PostType } from '../../lib/microformats2/index.js'
// import type { Jf2PostType } from '../../lib/microformats2/index.js'
// import type { ActionType } from '../../lib/micropub/index.js'

// export interface PostRequestBody {
//   access_token?: string
//   action?: ActionType
//   h?: Jf2PostType
//   // type?: Jf2PostType | Mf2PostType[]
//   // type?: Jf2PostType
//   url?: string
// }

export interface PostRequestBody extends Jf2, Mf2 {}

// TODO: try making requests to the Micropub endpoint using various Micropub
// clients before finalizing these interfaces.

// export interface PostRequestBodyJf2 extends Jf2 {
//   access_token?: string
//   action?: ActionType
//   h?: Jf2PostType
//   // type?: Jf2PostType | Mf2PostType[]
//   // type?: Jf2PostType
//   url?: string
// }

// export interface PostRequestBodyMf2 {
//   access_token?: string
//   items: Mf2Item[]
//   url?: string
// }

// export type PostRequestBody = PostRequestBodyJf2 | PostRequestBodyMf2
