envfile := justfile_directory() / ".env"


# List all recipes
default:
  just --list

# Start the database service
start-db:
  #!/usr/bin/env nu
  # Raise error if the database is already running
  let db_state = (^docker compose ps db --format json | from json | get -o State | default "")
  if $db_state == "running" {
      print "Database is already running."
      exit 1
  }
  ^docker compose up -d db

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

# Lint the backend code
[group('backend')]
[working-directory: 'backend']
lint-backend:
  dotenvx run -f {{envfile}} -- uv run ruff check

# Start the frontend service for development
[group('frontend')]
[working-directory: 'frontend']
start-frontend:
  dotenvx run -f {{envfile}} -- pnpm run dev

[group('frontend')]
[working-directory: 'frontend']
typecheck:
  pnpm run typecheck

[group('frontend')]
[working-directory: 'frontend']
lint-frontend:
  pnpm exec biome check

lint-markdown:
  pnpm dlx markdownlint-cli .
