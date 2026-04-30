import fs from 'fs';
import path from 'path';
import pool from './client';

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  console.log('Running database migrations...');

  for (const file of files) {
    if (file.endsWith('.sql')) {
      console.log(`Executing migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await pool.query(sql);
        console.log(`✓ ${file} completed`);
      } catch (error) {
        console.error(`✗ ${file} failed:`, error);
        throw error;
      }
    }
  }

  console.log('All migrations completed successfully!');
  await pool.end();
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
