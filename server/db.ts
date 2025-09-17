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
    console.log('Initializing database schema...');
    
    // Create flight_searches table with timeout
    const createTable = db.execute(sql`
      CREATE TABLE IF NOT EXISTS "flight_searches" (
        "id" SERIAL PRIMARY KEY,
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

    // Add timeout to prevent hanging
    await Promise.race([
      createTable,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database initialization timeout')), 10000)
      )
    ]);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    console.log('Continuing without database initialization...');
  }
}
