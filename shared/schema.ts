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

// AI Vacation Plans table - to store and track AI-generated vacation plans
export const vacationPlans = pgTable("vacation_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  region: varchar("region", { length: 100 }),
  duration: integer("duration"), // days
  travelStyle: varchar("travel_style", { length: 50 }),
  interests: text("interests"), // JSON array of interests
  departureCity: varchar("departure_city", { length: 100 }),
  planData: text("plan_data"), // JSON string with full AI-generated plan
  hotelData: text("hotel_data"), // JSON string with hotel recommendations
  flightData: text("flight_data"), // JSON string with flight routing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});