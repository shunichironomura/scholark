# FastAPI Backend

## Development

### Commands

All commands are run from the `backend` directory.

Create a migration script (replace `../.env` with your actual environment file if needed):

```bash
dotenvx run -f ../.env -- uv run alembic revision --autogenerate -m "your message"
```

Run the migration:

```bash
dotenvx run -f ../.env -- uv run alembic upgrade head
```

Start the development server:

```bash
dotenvx run -f ../.env -- uv run fastapi dev src/scholark/main.py
```
