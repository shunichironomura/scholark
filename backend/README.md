# FastAPI Backend

## Development

### Commands

All commands are run from the `backend` directory.

Create a migration script:

```bash
dotenvx run -f ../.env.local -- uv run alembic revision --autogenerate -m "your message"
```

Run the migration:

```bash
dotenvx run -f ../.env.local -- uv run alembic upgrade head
```

Start the development server:

```bash
dotenvx run -f ../.env.local -- uv run fastapi dev src/scholark/main.py
```
