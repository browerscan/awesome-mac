// ============================================
// Drizzle ORM Configuration
// ============================================

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/drizzle/schema.ts',
  out: './src/db/schema/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/awesome_mac',
  },
});
