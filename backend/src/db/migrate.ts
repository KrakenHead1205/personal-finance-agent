import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pool from './pool';

// Load environment variables
dotenv.config();

/**
 * Migration runner
 * Reads and executes SQL migration files in order
 */
async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    // Read all migration files
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort to ensure order (001_, 002_, etc.)

    if (files.length === 0) {
      console.log('⚠️  No migration files found in', migrationsDir);
      process.exit(0);
    }

    console.log(`Found ${files.length} migration file(s):\n`);

    // Execute each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`📄 Running migration: ${file}`);

      // Read SQL file
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute SQL
      await pool.query(sql);

      console.log(`✅ Successfully executed: ${file}\n`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run migrations
runMigrations();

