#!/bin/sh
set -e

# Point SQLite at the persistent volume so data survives restarts
export DATABASE_URL="file:/data/prod.db"

echo "Applying database schema..."
npx prisma db push --skip-generate --accept-data-loss

echo "Seeding database..."
node ./prisma/seed.cjs

echo "Starting server on port ${PORT:-3000}..."
node server.js
