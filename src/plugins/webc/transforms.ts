/**
 * @file [Custom Transforms](https://github.com/11ty/webc?tab=readme-ov-file#custom-transforms) to attach to a WebC instance.
 */
import type { TransformCallback } from '@11ty/webc'

/**
 * Prepends "foo-" to the content.
 *
 * @example
 * <template webc:type="foo">
 *   hello
 * </template>
 *
 * Here `hello` will be transformed to `foo-hello`.
 */
export const foo: TransformCallback = async (content, _node) => {
  return `foo-${content}`
}
