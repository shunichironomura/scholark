/**
 * Data migration script from Cloudflare D1 to PostgreSQL
 *
 * This script reads data exported from D1 and imports it into PostgreSQL.
 *
 * Usage:
 * 1. Export data from D1 using Wrangler:
 *    wrangler d1 export scholark --output=d1-export.sql
 *
 * 2. Run this script:
 *    bun run scripts/migrate-data.ts
 */

import { db } from '../src/db';
import * as schema from '../src/db/schema';
import fs from 'fs';
import { parse } from 'sql-parser';

// Configuration
const D1_EXPORT_FILE = './d1-export.sql';

async function migrateData() {
  console.log('Starting data migration from D1 to PostgreSQL...');

  try {
    // Read the exported SQL file
    if (!fs.existsSync(D1_EXPORT_FILE)) {
      console.error(`Error: Export file ${D1_EXPORT_FILE} not found.`);
      console.error('Please export your D1 database first using:');
      console.error('wrangler d1 export scholark --output=d1-export.sql');
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(D1_EXPORT_FILE, 'utf-8');

    // Parse the SQL content to extract INSERT statements
    const insertStatements = extractInsertStatements(sqlContent);

    // Process each table
    await migrateTable(insertStatements, 'user', schema.user);
    await migrateTable(insertStatements, 'conference', schema.conference);
    await migrateTable(insertStatements, 'user_label', schema.userLabel);
    await migrateTable(insertStatements, 'user_conference_label', schema.userConferenceLabel);
    await migrateTable(insertStatements, 'research_topic', schema.researchTopic);
    await migrateTable(insertStatements, 'user_conference_plan', schema.userConferencePlan);
    await migrateTable(insertStatements, 'topic_note', schema.topicNote);

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during data migration:', error);
    process.exit(1);
  }
}

function extractInsertStatements(sqlContent: string) {
  const insertStatements: Record<string, any[]> = {};

  // Simple regex-based parser for INSERT statements
  // This is a simplified approach and might need adjustments for complex SQL
  const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi;

  let match;
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const columns = match[2].split(',').map(col => col.trim());
    const values = parseValues(match[3]);

    if (!insertStatements[tableName]) {
      insertStatements[tableName] = [];
    }

    const row: Record<string, any> = {};
    columns.forEach((col, index) => {
      row[col] = values[index];
    });

    insertStatements[tableName].push(row);
  }

  return insertStatements;
}

function parseValues(valuesStr: string) {
  const values: any[] = [];
  let currentValue = '';
  let inString = false;
  let escaping = false;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (escaping) {
      currentValue += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === "'" && !inString) {
      inString = true;
      continue;
    }

    if (char === "'" && inString) {
      inString = false;
      continue;
    }

    if (char === ',' && !inString) {
      values.push(processValue(currentValue.trim()));
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (currentValue.trim()) {
    values.push(processValue(currentValue.trim()));
  }

  return values;
}

function processValue(value: string) {
  if (value === 'NULL') {
    return null;
  }

  // Try to parse as JSON
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // Not valid JSON, continue with other processing
    }
  }

  // Remove quotes if string
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.substring(1, value.length - 1);
  }

  // Try to parse as number
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  return value;
}

async function migrateTable(insertStatements: Record<string, any[]>, tableName: string, tableSchema: any) {
  const rows = insertStatements[tableName] || [];

  if (rows.length === 0) {
    console.log(`No data found for table ${tableName}, skipping...`);
    return;
  }

  console.log(`Migrating ${rows.length} rows to ${tableName} table...`);

  // Process rows in batches to avoid overwhelming the database
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    // Transform data to match PostgreSQL schema
    const transformedBatch = batch.map(row => {
      const transformedRow: Record<string, any> = {};

      // Map each column based on the table
      Object.keys(row).forEach(key => {
        const value = row[key];

        // Special handling for metadata in conference table
        if (tableName === 'conference' && key === 'metadata' && typeof value === 'string') {
          try {
            transformedRow[camelCase(key)] = JSON.parse(value);
          } catch (e) {
            transformedRow[camelCase(key)] = value;
          }
        } else {
          transformedRow[camelCase(key)] = value;
        }
      });

      return transformedRow;
    });

    // Insert the batch
    try {
      await db.insert(tableSchema).values(transformedBatch);
      console.log(`  Inserted batch ${i / BATCH_SIZE + 1} (${batch.length} rows)`);
    } catch (error) {
      console.error(`Error inserting batch for ${tableName}:`, error);
      throw error;
    }
  }

  console.log(`Completed migration for ${tableName}`);
}

// Helper function to convert snake_case to camelCase
function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Run the migration
migrateData().catch(console.error);
