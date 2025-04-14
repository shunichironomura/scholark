# Scholark

**Scholark** is a minimalist, flexible SaaS tool that helps researchers and students manage their research schedules effectively.

## 🎯 Purpose

The goal of Scholark is to fill the gap between traditional calendar tools and academic workflow platforms by providing:

- A personalized timeline of upcoming conferences, submissions, and research goals
- Shared and community-curated conference information
- A lightweight system for managing academic milestones without the overhead of citation managers or networking platforms

## 🧰 Key Features

- 📅 **Conference Tracking**: Add and browse conference metadata (name, dates, abstract/paper deadlines, website, etc.)
- 🏷️ **Custom Labels**: Mark conferences with user-defined labels (e.g. "Interested", "Attending")
- 🧠 **Personal Notes**: Store private notes per conference (e.g. paper title, bibtex, GitHub links, misc info)
- 🧭 **Research Roadmap**: Define personal research topics and link them to planned conference submissions
- 🔁 **Real-Time Calendar Integration**: Subscribe to an always-up-to-date iCal feed for personalized scheduling
- 👥 **Community Sharing**: Share and discover conference info submitted by other users

---

## 🏗️ Technology Stack

### 🖥️ **Frontend**

- **React** — modern, component-based UI
- **Tailwind CSS** — minimalist, accessible styling system
- **shadcn/ui** — component library built on Tailwind CSS

### 🧠 **Backend**

- **Bun** - fast JavaScript/TypeScript runtime
- **Hono** - small, simple, and ultrafast web framework
- **PostgreSQL** - powerful, open-source relational database
- **Drizzle ORM** - TypeScript ORM for SQL databases
- **Google OIDC** - authentication via Google OAuth

### 🛠️ **Tooling**

- **TypeScript** — safe, modern language for both backend and frontend
- **Vite** — fast, modern build tool for frontend
- **Docker** — containerization for local development and deployment
- **pnpm** — package manager in place of npm/yarn

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)
- [Docker](https://www.docker.com/) and Docker Compose
- [pnpm](https://pnpm.io/) (v8.0.0 or higher)
- Google OAuth credentials (for authentication)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/scholark.git
   cd scholark
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Google OAuth credentials and other configuration.

5. Start the development environment with Docker:

   ```bash
   pnpm docker:up
   ```

6. Generate the database schema:

   ```bash
   pnpm db:generate
   ```

7. Run database migrations:

   ```bash
   pnpm db:migrate
   ```

8. Start the development server:

   ```bash
   pnpm dev
   ```

9. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

### Development Scripts

- `pnpm dev` - Start the development server
- `pnpm dev:frontend` - Start the frontend development server only
- `pnpm build` - Build the frontend and backend for production
- `pnpm build:server` - Build only the backend for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint to check code quality
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio to view and edit database
- `pnpm docker:up` - Start Docker containers
- `pnpm docker:down` - Stop Docker containers
- `pnpm docker:build` - Rebuild Docker containers

## 📦 Project Structure

```
scholark/
├── src/                  # Source code
│   ├── api/              # API routes
│   ├── db/               # Database configuration and schema
│   ├── react-app/        # Frontend React application
│   └── shared/           # Shared types and utilities
├── drizzle/              # Database migrations
├── scripts/              # Utility scripts
├── public/               # Static assets
├── docker-compose.yml    # Docker configuration
├── Dockerfile            # Docker build configuration
└── README.md             # Project documentation
```

## 🔄 Database Setup

The project uses PostgreSQL with Drizzle ORM. The database schema is defined in `src/db/schema.ts` and migrations are managed by Drizzle.

To set up the database:

1. Start the PostgreSQL container:

   ```bash
   pnpm docker:up
   ```

2. Generate the database migrations:

   ```bash
   pnpm db:generate
   ```

3. Run the migrations:

   ```bash
   pnpm db:migrate
   ```

You can also use Drizzle Studio to view and edit the database:

```bash
pnpm db:studio
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
