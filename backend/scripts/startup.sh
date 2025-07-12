#!/bin/bash
set -e

echo "Starting Scholark backend..."

# Check if auto-migration is enabled (default to true for development)
AUTO_MIGRATE="${SCHOLARK_DB_AUTO_MIGRATE:-true}"

if [ "$AUTO_MIGRATE" = "true" ]; then
    echo "Auto-migration is enabled. Running database migrations..."

    # Run alembic migrations
    # Using alembic directly since we're already in the container with dependencies installed
    alembic upgrade head

    if [ $? -eq 0 ]; then
        echo "Database migrations completed successfully."
    else
        echo "Error: Database migrations failed!"
        exit 1
    fi
else
    echo "Auto-migration is disabled. Skipping database migrations."
    echo "Please ensure migrations have been run manually before starting the backend."
fi

# Start the FastAPI application
echo "Starting FastAPI application..."
exec fastapi run src/scholark/main.py
