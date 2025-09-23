import { sql } from "drizzle-orm";
import { pgTable, serial, varchar, timestamp, text, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { z } from "zod";

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
  
  // Enhanced fields for multi-city planning
  isMultiCity: boolean("is_multi_city").default(false),
  cities: text("cities"), // JSON array of city objects with duration
  budgetAllocation: text("budget_allocation"), // JSON object with budget breakdown
  travelPace: varchar("travel_pace", { length: 30 }).default("moderate"), // slow, moderate, fast
  accommodationType: varchar("accommodation_type", { length: 50 }).default("hotel"), // hotel, hostel, airbnb, mixed
  transportPreference: varchar("transport_preference", { length: 50 }).default("flights"), // flights, trains, buses, mixed
  
  // Hotel preferences
  hotelPreferences: text("hotel_preferences"), // JSON object with amenities, location, price tier
  pricePerDay: decimal("price_per_day", { precision: 8, scale: 2 }),
  seasonOptimized: boolean("season_optimized").default(true),
  
  planData: text("plan_data"), // JSON string with full AI-generated plan
  hotelData: text("hotel_data"), // JSON string with hotel recommendations
  flightData: text("flight_data"), // JSON string with flight routing
  routingData: text("routing_data"), // JSON string with multi-city routing optimization
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Zod validation schemas for flight search API
export const flightSearchSchema = z.object({
  origins: z.array(z.string().min(2).max(3))
    .min(1, "At least one origin is required")
    .max(5, "Maximum 5 origins allowed"),
  destinations: z.array(z.string().min(2).max(3))
    .min(1, "At least one destination is required")
    .max(5, "Maximum 5 destinations allowed"),
  dateRange: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional()
  }),
  departureFlex: z.number().int().min(0).max(30),
  returnFlex: z.number().int().min(0).max(30),
  autoRecommendStopovers: z.boolean(),
  includeNeighboringCountries: z.boolean()
});

export type FlightSearchRequest = z.infer<typeof flightSearchSchema>;

// Zod validation schemas for vacation planning API
export const vacationPlanRequestSchema = z.object({
  // Basic required fields
  budget: z.string().min(1, "Budget is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Budget must be a positive number"),
  region: z.string().min(1, "Region is required").max(100, "Region too long"),
  duration: z.string().min(1, "Duration is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 90, "Duration must be between 1-90 days"),
  travelStyle: z.string().min(1, "Travel style is required").max(50, "Travel style too long"),
  departureCity: z.string().min(1, "Departure city is required").max(100, "Departure city too long"),
  
  // Optional fields
  interests: z.array(z.string()).optional().default([]),
  isMultiCity: z.boolean().optional().default(false),
  travelPace: z.enum(["slow", "moderate", "fast"]).optional().default("moderate"),
  accommodationType: z.enum(["hotel", "hostel", "airbnb", "mixed"]).optional().default("hotel"),
  transportPreference: z.enum(["flights", "trains", "buses", "mixed"]).optional().default("flights"),
  seasonOptimized: z.boolean().optional().default(true),
  hotelPreferences: z.object({
    priceRange: z.enum(["budget", "mid-range", "luxury"]).optional().default("mid-range"),
    amenities: z.array(z.string()).optional().default([]),
    locationPriority: z.enum(["city-center", "transport-hub", "quiet-area", "tourist-district"]).optional().default("city-center")
  }).optional().default({})
});

export const cityOptimizeRequestSchema = z.object({
  region: z.string().min(1, "Region is required"),
  budget: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  duration: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1),
  interests: z.array(z.string()).optional().default([]),
  travelStyle: z.string().min(1, "Travel style is required"),
  departureCity: z.string().min(1, "Departure city is required"),
  travelPace: z.enum(["slow", "moderate", "fast"]).optional().default("moderate")
});

export const budgetOptimizeRequestSchema = z.object({
  destinations: z.array(z.string()).min(1, "At least one destination required"),
  budget: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  duration: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1),
  travelStyle: z.string().min(1, "Travel style is required"),
  accommodationType: z.enum(["hotel", "hostel", "airbnb", "mixed"]).optional().default("hotel")
});

export const hotelAdvancedRequestSchema = z.object({
  destinations: z.array(z.string()).min(1, "At least one destination required"),
  budget: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  guests: z.number().int().min(1).max(10).optional().default(1),
  preferences: z.object({
    priceRange: z.enum(["budget", "mid-range", "luxury"]).optional().default("mid-range"),
    amenities: z.array(z.string()).optional().default([]),
    locationPriority: z.string().optional().default("city-center")
  }).optional().default({})
});

export const routeOptimizeRequestSchema = z.object({
  departureCity: z.string().min(1, "Departure city is required"),
  destinations: z.array(z.string()).min(1, "At least one destination required"),
  budget: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  duration: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 1),
  transportPreference: z.enum(["flights", "trains", "buses", "mixed"]).optional().default("flights")
});

// Response schemas for structured API responses
export const destinationSchema = z.object({
  name: z.string(),
  country: z.string().optional(),
  duration_days: z.number().int().positive().optional(),
  arrival_date: z.string().optional(),
  budget_allocation: z.number().optional(),
  highlights: z.array(z.string()).optional().default([]),
  cost_level: z.enum(["low", "medium", "high"]).optional()
});

export const budgetBreakdownSchema = z.object({
  flights: z.number().optional(),
  accommodation: z.number().optional(),
  activities: z.number().optional(),
  meals: z.number().optional(),
  transportation: z.number().optional(),
  emergency: z.number().optional()
});

export const vacationPlanResponseSchema = z.object({
  summary: z.object({
    duration: z.number().int().positive(),
    cities_count: z.number().int().positive().optional(),
    daily_budget_range: z.string().optional(),
    best_season: z.string().optional()
  }).optional(),
  destinations: z.array(destinationSchema).optional().default([]),
  routing: z.object({
    optimal_order: z.array(z.string()).optional().default([]),
    travel_methods: z.array(z.string()).optional().default([]),
    stopovers: z.array(z.string()).optional().default([]),
    total_travel_time: z.string().optional()
  }).optional(),
  budget_breakdown: budgetBreakdownSchema.optional(),
  daily_budgets: z.record(z.string(), z.number()).optional().default({}),
  accommodation_strategy: z.object({
    types: z.array(z.string()).optional().default([]),
    booking_timeline: z.string().optional(),
    location_priorities: z.array(z.string()).optional().default([])
  }).optional(),
  seasonal_optimization: z.object({
    best_months: z.array(z.string()).optional().default([]),
    weather_considerations: z.string().optional(),
    events: z.array(z.string()).optional().default([])
  }).optional(),
  cultural_insights: z.object({
    local_customs: z.array(z.string()).optional().default([]),
    language_tips: z.array(z.string()).optional().default([]),
    cultural_events: z.array(z.string()).optional().default([])
  }).optional(),
  flexibility_options: z.object({
    optional_cities: z.array(z.string()).optional().default([]),
    shorter_alternatives: z.array(z.string()).optional().default([]),
    budget_upgrades: z.array(z.string()).optional().default([])
  }).optional()
});

// API response wrapper schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().optional()
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.union([z.string(), z.object({}).passthrough(), z.undefined()]).optional(),
  timestamp: z.string().default(() => new Date().toISOString()),
  requestId: z.string().optional()
});

// Type exports
export type VacationPlanRequest = z.infer<typeof vacationPlanRequestSchema>;
export type CityOptimizeRequest = z.infer<typeof cityOptimizeRequestSchema>;
export type BudgetOptimizeRequest = z.infer<typeof budgetOptimizeRequestSchema>;
export type HotelAdvancedRequest = z.infer<typeof hotelAdvancedRequestSchema>;
export type RouteOptimizeRequest = z.infer<typeof routeOptimizeRequestSchema>;
export type VacationPlanResponse = z.infer<typeof vacationPlanResponseSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;