import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Bootstrap database schema on startup
export async function ensureSchema() {
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) UNIQUE,
        "name" VARCHAR(255),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create flight_searches table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "flight_searches" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER REFERENCES "users"("id"),
        "origins" TEXT,
        "destinations" TEXT,
        "departure_date" VARCHAR(50),
        "return_date" VARCHAR(50),
        "departure_flex" INTEGER DEFAULT 0,
        "return_flex" INTEGER DEFAULT 0,
        "auto_recommend_stopovers" BOOLEAN DEFAULT false,
        "include_neighboring_countries" BOOLEAN DEFAULT false,
        "search_timestamp" TIMESTAMP DEFAULT NOW(),
        "result_count" INTEGER DEFAULT 0
      )
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
  }
}
