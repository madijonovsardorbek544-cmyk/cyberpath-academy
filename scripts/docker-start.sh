#!/bin/sh
set -e
export DATABASE_PATH="${DATABASE_PATH:-/app/apps/server/data/cyberpath.db}"
mkdir -p "$(dirname "$DATABASE_PATH")"

if [ -n "$LITESTREAM_BUCKET" ]; then
  # The local disk is empty after every restart on free hosts: pull the latest copy first.
  litestream restore -config /app/litestream.yml -if-db-not-exists -if-replica-exists "$DATABASE_PATH"
  npm run db:setup
  exec litestream replicate -config /app/litestream.yml -exec "node apps/server/dist/index.js"
fi

# db:setup only seeds an empty database; it never wipes existing data.
npm run db:setup
exec node apps/server/dist/index.js
