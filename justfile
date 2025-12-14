envfile := justfile_directory() / ".env"


# List all recipes
default:
  just --list

# Start the database service (logs: logs/db.log, use 'just tail-db-logs' to follow container logs)
start-db:
  #!/usr/bin/env nu
  # Raise error if the database is already running
  let db_state = (^docker compose ps db --format json | from json | get -o State | default "")
  if $db_state == "running" {
      print "Database is already running."
      exit 1
  }
  mkdir logs
  rm -f logs/db.log
  ^docker compose up -d db o+e>| tee { save logs/db.log }

# Tail database logs
tail-db-logs:
  docker compose logs -f db

# Start the backend service for development (logs: logs/backend.log)
[group('backend')]
[working-directory: 'backend']
start-backend:
  #!/usr/bin/env nu
  # Raise error if the backend is already running on port 8000
  let port_in_use = (^lsof -i :8000 -sTCP:LISTEN | complete | get exit_code | $in == 0)
  if $port_in_use {
      print "Backend is already running on port 8000."
      exit 1
  }
  mkdir ../logs
  rm -f ../logs/backend.log
  with-env {SCHOLARK_DEV_MODE: "true"} {
    ^dotenvx run -f {{envfile}} -- uv run bash scripts/startup.sh o+e>| tee { save ../logs/backend.log }
  }

# Start the frontend service for development (logs: logs/frontend.log)
[group('frontend')]
[working-directory: 'frontend']
start-frontend:
  #!/usr/bin/env nu
  # Raise error if the frontend is already running on port 5173
  let port_in_use = (^lsof -i :5173 -sTCP:LISTEN | complete | get exit_code | $in == 0)
  if $port_in_use {
      print "Frontend is already running on port 5173."
      exit 1
  }
  mkdir ../logs
  rm -f ../logs/frontend.log
  ^dotenvx run -f {{envfile}} -- pnpm run dev o+e>| tee { save ../logs/frontend.log }

# Apply database migrations
[group('backend')]
[working-directory: 'backend']
apply-migrations:
  dotenvx run -f {{envfile}} -- uv run alembic upgrade head

# Lint the backend code
[group('backend')]
[working-directory: 'backend']
lint-backend:
  dotenvx run -f {{envfile}} -- uv run ruff check

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
