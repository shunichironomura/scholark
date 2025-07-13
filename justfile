envfile := justfile_directory() / ".env"


# List all recipes
default:
  just --list

# Start the database service
start-db:
  docker compose up -d db

# Apply database migrations
[group('backend')]
[working-directory: 'backend']
apply-migrations:
  dotenvx run -f {{envfile}} -- uv run alembic upgrade head

# Start the backend service for development
[group('backend')]
[working-directory: 'backend']
start-backend:
  dotenvx run -f {{envfile}} -- uv run fastapi dev src/scholark/main.py

# Start the frontend service for development
[group('frontend')]
[working-directory: 'frontend']
start-frontend:
  dotenvx run -f {{envfile}} -- pnpm run dev
