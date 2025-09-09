#!/bin/sh

echo "Starting backend application..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until npx prisma db push --skip-generate --accept-data-loss 2>/dev/null; do
  echo "Database is not ready yet. Retrying in 2 seconds..."
  sleep 2
done

echo "Database is ready! Running migrations..."

# Run database migrations
npx prisma migrate deploy

echo "Migrations completed. Starting application..."

# Start the application
exec node dist/main.js
