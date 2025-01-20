declare module '@11ty/webc' {
  import type { Readable } from 'node:stream'

  export class ComponentManager {
    constructor()
  }

  export class ModuleScript {}

  export class AstSerializer {
    constructor(options?: any)
  }

  export type RenderingMode = 'page' | 'component'

  export interface Options {
    file?: string
    input?: string
  }

  export interface Setup {
    ast?: any
    data?: Record<string, any>
    serializer?: AstSerializer
  }

  // A single glob, an array of globs, or a hash map of name->glob
  // https://github.com/11ty/webc/tree/main?tab=readme-ov-file#register-global-components
  type GlobOrObject = string | string[] | Record<string, string>

  interface Buckets {
    css: Record<string, any>
    js: Record<string, any>
  }

  interface Node {
    filePath: string
    ast: {
      nodeName: string
      mode: string
      childNodes: Node[]
    }
    content: string
    newLineStartIndeces: any
    mode: RenderingMode
    isTopLevelComponent: boolean
    hasDeclarativeShadowDom?: boolean
    ignoreRootTag: boolean
    scopedStyleHash?: any
    rootAttributeMode?: any
    rootAttributes: any[]
    slotTargets: Record<string, any>
    setupScript?: any
  }

  export type TransformCallback = (
    content: string,
    node: Node
  ) => Promise<string>

  export class WebC {
    constructor(options?: Options)

    astOptions: Record<string, string>
    bundlerMode: boolean
    customHelpers: Record<string, any>
    customScopedHelpers: Record<string, any>
    customTransforms: Record<string, any>
    globalComponents: Record<string, string>
    ignores: string[]

    setInputPath(filePath: string): void

    setContent(input: string, filePath?: string): void

    setGlobalComponentManager(manager: any): void

    getRenderingMode(content: string): RenderingMode

    getContent(): { content: string; mode: RenderingMode }

    static getASTFromString(str: string): Promise<any>

    static getFromFilePath(filePath: string): Promise<any>

    getAST(content: string): any

    // setTransform(
    //   key: string,
    //   callback: (content: string, node: Node) => Promise<string>
    // ): void
    setTransform(key: string, callback: TransformCallback): void

    setHelper(key: string, callback: Function, isScoped?: boolean): void

    setAlias(key: string, callback: Function, isScoped?: boolean): void

    static findGlob(glob: string, ignores: string[]): string[]

    static getComponentsMap(
      globOrObject?: GlobOrObject,
      ignores?: string[]
    ): Record<string, string>

    defineComponents(globOrObject: GlobOrObject): void

    setUidFunction(fn: Function): void

    setup(options?: { data: any; components: any }): Promise<Setup>

    getComponents(setup: Setup): string[]

    setBundlerMode(mode: boolean): void

    stream(options?: Setup): Promise<{
      html: Readable
      components: string[]
      css: Readable
      js: Readable
      buckets: Buckets
    }>

    compile(options?: Setup): Promise<{
      html: string
      components: string[]
      css: string[]
      js: string[]
      buckets: Buckets
    }>
  }
}
