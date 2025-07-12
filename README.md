<div align="center">
    <img src="frontend/app/assets/logo-wide.png" alt="Scholark Logo" >
</div>

**Scholark** (Scholar + Lark) helps researchers and students manage their research schedules effectively.

## 🧰 Key Features

- 📅 **Conference Tracking**: Add and browse conference metadata (name, dates, abstract/paper deadlines, website, etc.)
- 🏷️ **Custom Labels**: Mark conferences with user-defined labels (e.g. "Interested", "Attending")
- 👥 **Community Sharing**: Share and discover conference info submitted by other users

## 🏗️ Technology Stack

### 🖥️ **Frontend**

- **TypeScript** as frontend language
- **React Router** as frontend framework
- **React** as UI library
- **Tailwind CSS** as styling system
- **shadcn/ui** as React component library
- **Vite** as build tool
- **Hey API** for API client autogeneration
- **pnpm** as package manager

### 🧠 **Backend**

- **Python** as backend language
- **FastAPI** as web framework
- **PostgreSQL** as database
- **SQLModel** as ORM
- **Alembic** for database migrations
- **OAuth2** and **LDAP** for authentication
- **uv** as Python package manager

### 🛠️ **Tooling**

- **Docker** for containerization

---

## 🚀 Getting Started

### Quick Start (with auto-migration)

For local development and trying out the system:

```bash
# Database migrations will run automatically on startup
docker compose up -d
```

Access the frontend at [http://localhost:5173](http://localhost:5173).

### Production Deployment

For production environments where you want manual control over migrations:

1. Start the database service if not already running:

    ```bash
    docker compose up -d db
    ```

2. Run the migrations manually:

    ```bash
    cd backend && dotenvx run -f ../.env -- uv run alembic upgrade head && cd ..
    ```

3. Start the services. Make sure `SCHOLARK_DB_AUTO_MIGRATE` is set to `false` in your environment file:

    ```bash
    docker compose up -d
    ```

### Database Migration Control

The system supports automatic database migration on startup, controlled by the `SCHOLARK_DB_AUTO_MIGRATE` environment variable:

- `true` (default in `.env`): Migrations run automatically when the backend starts. Perfect for development and quick demos.
- `false` (set in `.env.development` and `.env.production`): Migrations must be run manually. Recommended for production deployments.

> [!WARNING]
> When `SCHOLARK_DB_AUTO_MIGRATE=false`, ensure database migrations are applied before starting the backend service, or the application will fail to start.
