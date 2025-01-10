# SQLite storage

This library implements the [storage API](../storage-api/README.md) using a SQLite database.

This project uses [Atlas](https://github.com/ariga/atlas) for automatic migration planning. See the [Atlas configuration file](https://atlasgo.io/atlas-schema/projects) `atlas.hcl`.

The command `atlas schema apply` generates the migrations required to bring the database to the state described in the provided Atlas schema.

## Development database

Apply the migrations to the development DB.

```sh
atlas schema apply --to file://schema.hcl --env dev --auto-approve
```

Seed the development DB and immediately open it in [DB Browser for SQLite](https://sqlitebrowser.org/).

```sh
sqlitebrowser micropub-dev.db --sql assets/queries/seed.sql
```

> [!TIP]
> Other nice GUIs to explore a SQLite database are [DBeaver](https://dbeaver.io/) and [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview).

Output the current schema of the database in SQL DDL.

```sh
atlas schema inspect --env dev --format '{{ sql . }}' > schema-dev.sql
```

Retrieve some records.

```sh
sqlite3 -header -column micropub-dev.db "SELECT rowid, * FROM authorization_codes";
sqlite3 -header -column micropub-dev.db "SELECT * FROM clients"
sqlite3 -header -column micropub-dev.db "SELECT * FROM profiles"
```

Check whether the tables includes a [`rowid` column](https://www.sqlite.org/rowidtable.html).

## Production database

Apply the migrations to the production DB.

```sh
atlas schema apply --to file://schema.hcl --env prod
```

Output the current schema of the database in SQL DDL.

```sh
atlas schema inspect --env prod --format '{{ sql . }}' > schema-prod.sql
```

Insert some records into the production database using the [Turso CLI](https://github.com/tursodatabase/turso-cli).

```sh
turso db shell micropub "INSERT INTO clients ('client_id', 'me', 'redirect_uri') VALUES ('https://micropub.fly.dev/id', 'https://giacomodebidda.com/', 'https://micropub.fly.dev/auth/callback');"

turso db shell micropub "INSERT INTO profiles ('me', 'name', 'photo', 'url', 'email') VALUES ('https://giacomodebidda.com/', 'Giacomo Debidda', 'https://avatars.githubusercontent.com/u/5048090', 'https://www.giacomodebidda.com/', 'giacomo@giacomodebidda.com');"
```

Retrieve some records.

```sh
turso db shell micropub "SELECT * FROM profiles;"
```

Check whether the tables includes a [`rowid` column](https://www.sqlite.org/rowidtable.html).

```sh
turso db shell micropub "SELECT rowid, * FROM authorization_codes";
turso db shell micropub "SELECT rowid, * FROM clients";
turso db shell micropub "SELECT rowid, * FROM profiles";
```
