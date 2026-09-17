#!/bin/sh
set -e

# Use /tmp for the SQLite database (writable on Cloud Run, ephemeral but persistent per instance lifetime)
export DATABASE_URL="file:/tmp/loyalty.db"
export SHADOW_DATABASE_URL="file:/tmp/loyalty-shadow.db"

# Push the schema to create tables
npx prisma db push --skip-generate

# If seed data doesn't exist, seed it
node prisma/seed.mjs || true

# Start the Next.js server
exec npx next start -H 0.0.0.0 -p ${PORT:-8080}
