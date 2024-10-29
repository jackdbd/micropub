import test from 'node:test'
import assert from 'node:assert'
import { defFastify } from './app.js'

const defTestApp = () => {
  return defFastify({
    base_url: `http://localhost:${process.env.PORT}`,
    cloudflare_account_id: process.env.CLOUDFLARE_ACCOUNT_ID!,
    cloudflare_r2_access_key_id: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    cloudflare_r2_bucket_name: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    cloudflare_r2_secret_access_key:
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    logger: { level: 'silent' },
    report_all_ajv_errors: true,
    use_development_error_handler: false,
    use_secure_flag_for_session_cookie: false
  })
}

test('basic server', async (t) => {
  const app = defTestApp()

  t.after(async () => {
    await app.close()
  })

  const response = await app.inject({
    method: 'GET',
    url: '/'
  })

  assert.strictEqual(response.statusCode, 200)
  // assert.deepEqual(response.json(), { hello: 'world' })
})

test('handles notfound', async (t) => {
  const app = defTestApp()

  t.after(async () => {
    await app.close()
  })

  const response = await app.inject({
    method: 'GET',
    url: '/notfound'
  })

  assert.strictEqual(response.statusCode, 404)
  //   assert.deepEqual(
  //     response.body,
  //     "I'm sorry, I couldn't find what you were looking for."
  //   )
})
