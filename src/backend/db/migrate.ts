import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Run migrations
async function runMigrations() {
  console.log('Running migrations...');

  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
