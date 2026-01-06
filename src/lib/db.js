import { createPool } from "@vercel/postgres";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const db = connectionString ? createPool({ connectionString }) : null;

export function requireDb() {
  if (!db) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL (or POSTGRES_URL) before using DB features."
    );
  }
  return db;
}

