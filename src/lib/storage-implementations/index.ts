import Ajv from 'ajv'
import { Environment } from '../../constants.js'
import { implementation as implementationJSON } from './fs-json.js'
import { implementation as implementationJSONLines } from './fs-jsonl.js'
import { implementation as implementationMemoryAtom } from './mem-atom.js'
import { implementation as implementationSQLite } from './sqlite.js'

export {
  isInsertOrReplaceQuery,
  isSelectQuery,
  isUpdateQuery
} from './query.js'

export {
  createdRecord,
  deletedRecord,
  undeletedRecord,
  updatedRecord
} from './record.js'

export interface Config {
  ajv: Ajv
  backend: string
  env: Environment
}

/**
 * Given a storage backend `backend` and an environment `env`, returns the
 * available implementation of the storage API.
 */
export const defStorage = (config: Config) => {
  const { ajv, backend, env } = config

  switch (backend) {
    case 'fs-json': {
      return implementationJSON({ ajv, env })
    }

    case 'fs-jsonl': {
      return implementationJSONLines({ ajv, env })
    }

    case 'mem-atom': {
      return implementationMemoryAtom({ ajv, env })
    }

    case 'sqlite': {
      return implementationSQLite({ ajv, env })
    }

    default: {
      return {
        error: new Error(
          `no implementation available for storage backend '${backend}', environment '${env}'`
        )
      }
    }
  }
}
