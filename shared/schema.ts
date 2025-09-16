import { sql } from "drizzle-orm";
import { pgTable, serial, varchar, timestamp, text, boolean, integer, decimal } from "drizzle-orm/pg-core";

// Users table - for potential future auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Flight searches table - to track user searches (optional)
export const flightSearches = pgTable("flight_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  origins: text("origins"), // JSON string of origin codes
  destinations: text("destinations"), // JSON string of destination codes  
  departureDate: varchar("departure_date", { length: 50 }),
  returnDate: varchar("return_date", { length: 50 }),
  departureFlex: integer("departure_flex").default(0),
  returnFlex: integer("return_flex").default(0),
  autoRecommendStopovers: boolean("auto_recommend_stopovers").default(false),
  includeNeighboringCountries: boolean("include_neighboring_countries").default(false),
  searchTimestamp: timestamp("search_timestamp").defaultNow(),
  resultCount: integer("result_count").default(0)
});