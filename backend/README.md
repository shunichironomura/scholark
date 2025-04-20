# FastAPI Backend

## Development

### Commands

All commands are run from the `backend` directory.

Create a migration:

```bash
dotenvx run -f ../.env.local -- uv run alembic revision --autogenerate -m "your message"
```
