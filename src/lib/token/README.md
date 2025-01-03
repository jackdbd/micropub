# Token

Helper functions for working with JWT tokens and [jose](https://github.com/panva/jose/).

Each JWT is signed with RS256, using a random JWK from a given **private** JWKS.

Each JWT is verified with RS256, using the associated JWK from a given **public** JWKS.
