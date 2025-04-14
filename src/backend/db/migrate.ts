import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';
import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config();

// Get the client from the db object
const client = (db as any).session?.client?.client;

// Run migrations
async function runMigrations() {
  console.log('Running migrations...');

  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');

    // Close the connection and exit
    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);

    // Close the connection and exit with error
    await closeConnection();
    process.exit(1);
  }
}

// Function to close the database connection
async function closeConnection() {
  if (client && typeof client.end === 'function') {
    console.log('Closing database connection...');
    await client.end();
    console.log('Database connection closed');
  }
}

runMigrations();
