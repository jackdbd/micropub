import { describe, it } from 'node:test'
import assert from 'node:assert'
import { normalizeJf2 } from '../../dist/lib/micropub/index.js'

describe('normalizeJf2', () => {
  it('can process category[]', () => {
    const input = {
      h: 'entry',
      content: 'A simple note.',
      'category[]': ['foo', 'bar']
    }

    const output = normalizeJf2(input)

    assert.strictEqual(output.category[0], 'foo')
    assert.strictEqual(output.category[1], 'bar')
  })

  it('can process photo[]', () => {
    const input = {
      h: 'entry',
      content: 'A simple note.',
      'photo[]': [
        { alt: 'alternate text 0', value: 'http://example.com/photo0.jpg' },
        { alt: 'alternate text 1', value: 'http://example.com/photo1.jpg' }
      ]
    }

    const output = normalizeJf2(input)

    assert.strictEqual(output.photo[0].alt, 'alternate text 0')
    assert.strictEqual(output.photo[1].alt, 'alternate text 1')
    assert.strictEqual(output.photo[0].value, 'http://example.com/photo0.jpg')
    assert.strictEqual(output.photo[1].value, 'http://example.com/photo1.jpg')
  })

  it('can process category[][0] and category[][1]', () => {
    const input = {
      h: 'entry',
      content: 'A simple note.',
      'category[][0]': 'foo',
      'category[][1]': 'bar'
    }

    const output = normalizeJf2(input)

    assert.strictEqual(output.category[0], 'foo')
    assert.strictEqual(output.category[1], 'bar')
  })
})
