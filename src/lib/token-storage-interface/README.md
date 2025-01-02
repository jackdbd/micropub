# Token storage interface

Set of functions for issuing and revoking JSON Web Tokens.

Each JWT is signed with RS256, using a random JWK from a given **private** JWKS.

Each JWT is verified with RS256, using the associated JWK from a given **public** JWKS.

The functions defined in this module leave to the user the responsibility of persisting information related to the issued/revoked tokens. These functions provide an interface, a protocol for persisting the tokens to some storage (e.g. the filesystem, a database). The actual implementation must be provided via dependency injection.

- `markAccessTokenAsRevoked` (TODO: remove `revokeAccessToken`)
- `storeAccessToken`

Token storage implementations:

- [Filesystem](../fs-storage/README.md)
- [In-Memory](../in-memory-storage/README.md)
- [GitHub](../github-storage/README.md) TODO
- [R2](../r2-storage/README.md) TODO
- [Turso](../turso-storage/README.md) TODO
