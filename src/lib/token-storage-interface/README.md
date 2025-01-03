# Token storage interface

This library defines a protocol for storing and retrieving access tokens and refresh tokens.

- `retrieveAccessToken`
- `retrieveRefreshToken`
- `storeAccessToken`
- `storeRefreshToken`

Implementations:

- [Filesystem](../fs-storage/README.md)
- [In-Memory](../in-memory-storage/README.md)
- [GitHub](../github-storage/README.md) TODO
- [R2](../r2-storage/README.md) TODO
- [Turso](../turso-storage/README.md) TODO
