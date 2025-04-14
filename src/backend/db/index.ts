import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create connection string from environment variables
const connectionString = process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Create connection pool
const client = postgres(connectionString, { max: 10 });

// Create Drizzle ORM instance
export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from './schema';
