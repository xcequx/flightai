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

// Enhanced flight searches table with new fields for AI intelligence
export const enhancedFlightSearches = pgTable("enhanced_flight_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  origins: text("origins"), // JSON string of origin codes
  destinations: text("destinations"), // JSON string of destination codes  
  departureDate: varchar("departure_date", { length: 50 }),
  returnDate: varchar("return_date", { length: 50 }),
  departureFlex: integer("departure_flex").default(0),
  returnFlex: integer("return_flex").default(0),
  travelClass: varchar("travel_class", { length: 20 }).default("ECONOMY"), // ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
  adults: integer("adults").default(1),
  children: integer("children").default(0),
  infants: integer("infants").default(0),
  maxResults: integer("max_results").default(50),
  nonStop: boolean("non_stop").default(false),
  autoRecommendStopovers: boolean("auto_recommend_stopovers").default(false),
  includeNeighboringCountries: boolean("include_neighboring_countries").default(false),
  affiliateProvider: varchar("affiliate_provider", { length: 50 }),
  
  // NEW: AI-powered features
  searchId: varchar("search_id", { length: 100 }).unique(), // Unique identifier for tracking AI recommendations
  userPreferences: text("user_preferences"), // JSON: travel style, interests, budget sensitivity
  stopoverInsights: text("stopover_insights"), // JSON: AI-generated stopover recommendations with reasoning
  priceBands: text("price_bands"), // JSON: flexible date pricing analysis across date ranges
  aiRecommendations: text("ai_recommendations"), // JSON: full AI analysis and recommendations
  
  searchTimestamp: timestamp("search_timestamp").defaultNow(),
  resultCount: integer("result_count").default(0),
  multiLegCount: integer("multi_leg_count").default(0), // NEW: count of multi-leg options found
  bestSavingsFound: decimal("best_savings_found", { precision: 8, scale: 2 }), // NEW: best savings amount discovered
  aiProcessingTime: integer("ai_processing_time").default(0), // NEW: AI processing time in ms
  apiSource: varchar("api_source", { length: 20 }).default("amadeus") // amadeus, aviationstack
});

// Hotel searches table
export const hotelSearches = pgTable("hotel_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  cityCode: varchar("city_code", { length: 3 }),
  checkInDate: varchar("check_in_date", { length: 50 }),
  checkOutDate: varchar("check_out_date", { length: 50 }),
  adults: integer("adults").default(1),
  children: integer("children").default(0),
  rooms: integer("rooms").default(1),
  priceRange: varchar("price_range", { length: 20 }).default("mid-range"), // budget, mid-range, luxury
  amenities: text("amenities"), // JSON array of required amenities
  chainCodes: text("chain_codes"), // JSON array of preferred hotel chains
  ratings: text("ratings"), // JSON array of accepted star ratings
  currency: varchar("currency", { length: 3 }).default("PLN"),
  affiliateProvider: varchar("affiliate_provider", { length: 50 }),
  searchTimestamp: timestamp("search_timestamp").defaultNow(),
  resultCount: integer("result_count").default(0)
});

// Affiliate tracking table
export const affiliateClicks = pgTable("affiliate_clicks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  searchId: varchar("search_id", { length: 100 }), // Can reference flight or hotel search
  searchType: varchar("search_type", { length: 20 }), // flight, hotel
  provider: varchar("provider", { length: 50 }), // amadeus, booking, expedia, etc.
  affiliateUrl: text("affiliate_url"),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }),
  commission: decimal("commission", { precision: 8, scale: 2 }),
  clickTimestamp: timestamp("click_timestamp").defaultNow(),
  conversionTracked: boolean("conversion_tracked").default(false),
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 })
});

// Enhanced Zod validation schemas for intelligent flight search API
export const flightSearchSchema = z.object({
  origins: z.array(z.string().min(2).max(3))
    .min(1, "At least one origin is required")
    .max(5, "Maximum 5 origins allowed"),
  destinations: z.array(z.string().min(2).max(3))
    .min(1, "At least one destination is required")
    .max(5, "Maximum 5 destinations allowed"),
  dateRange: z.object({
    from: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format"
    }),
    to: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format"
    }).optional()
  }),
  departureFlex: z.number().int().min(0).max(30).default(3),
  returnFlex: z.number().int().min(0).max(30).default(3),
  travelClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
  adults: z.number().int().min(1).max(9).default(1),
  children: z.number().int().min(0).max(8).default(0),
  infants: z.number().int().min(0).max(8).default(0),
  maxResults: z.number().int().min(1).max(250).default(50),
  nonStop: z.boolean().default(false),
  autoRecommendStopovers: z.boolean().default(false),
  includeNeighboringCountries: z.boolean().default(false),
  affiliateProvider: z.string().optional(),
  
  // NEW: AI-powered search enhancements
  userPreferences: z.object({
    travelStyle: z.enum(["budget", "comfort", "luxury", "adventure", "business"]).optional(),
    interests: z.array(z.string()).optional(),
    budgetSensitivity: z.enum(["low", "medium", "high"]).default("medium"),
    layoverPreference: z.enum(["none", "short", "explore", "no_preference"]).default("no_preference"),
    timeVsPrice: z.enum(["time", "price", "balanced"]).default("balanced")
  }).optional(),
  enableAI: z.boolean().default(true), // Enable AI-powered recommendations
  searchId: z.string().optional() // For tracking and correlation
});

// Hotel search schema
export const hotelSearchSchema = z.object({
  cityCode: z.string().min(3).max(3),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  adults: z.number().int().min(1).max(9).default(1),
  children: z.number().int().min(0).max(8).default(0),
  rooms: z.number().int().min(1).max(8).default(1),
  priceRange: z.enum(["budget", "mid-range", "luxury"]).default("mid-range"),
  amenities: z.array(z.string()).default([]),
  chainCodes: z.array(z.string()).default([]),
  ratings: z.array(z.number().int().min(1).max(5)).default([]),
  currency: z.string().length(3).default("PLN"),
  affiliateProvider: z.string().optional()
});

export type FlightSearchRequest = z.infer<typeof flightSearchSchema>;
export type HotelSearchRequest = z.infer<typeof hotelSearchSchema>;

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
// NEW: AI-powered flight search schemas
export const stopoverInsightSchema = z.object({
  hub: z.object({
    iata: z.string(),
    name: z.string(),
    city: z.string(),
    country: z.string(),
    attractions: z.array(z.string()).optional(),
    description: z.string().optional(),
    averageDailyCost: z.number().optional()
  }),
  layoverDays: z.number().int().min(1).max(7),
  savings: z.number(),
  savingsPercent: z.number(),
  directPrice: z.number(),
  multiLegPrice: z.number(),
  totalCostWithStay: z.number().optional(),
  reasoning: z.string().optional(), // AI explanation for recommendation
  attractionScore: z.number().min(0).max(10).optional(),
  valueScore: z.number().min(0).max(10).optional() // Overall value proposition
});

export const priceBandSchema = z.object({
  dateRange: z.object({
    from: z.string(),
    to: z.string()
  }),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
    median: z.number()
  }),
  bestDeal: z.object({
    date: z.string(),
    price: z.number(),
    savingsFromMedian: z.number()
  }).optional(),
  flexibility: z.enum(["low", "medium", "high"]),
  recommendedDates: z.array(z.string()).optional()
});

export const aiFlightRecommendationSchema = z.object({
  summary: z.object({
    bestOption: z.enum(["direct", "stopover", "flexible_dates"]),
    maxSavings: z.number(),
    recommendedStopover: z.string().optional(),
    reasoning: z.string()
  }),
  stopovers: z.array(stopoverInsightSchema).optional(),
  priceBands: z.array(priceBandSchema).optional(),
  alternatives: z.object({
    cheaperDates: z.array(z.object({
      date: z.string(),
      price: z.number(),
      savings: z.number()
    })).optional(),
    nearbyAirports: z.array(z.object({
      iata: z.string(),
      name: z.string(),
      savings: z.number().optional()
    })).optional()
  }).optional(),
  confidence: z.number().min(0).max(1) // AI confidence in recommendations
});

// Enhanced flight search response with AI insights
export const enhancedFlightSearchResponseSchema = z.object({
  searchId: z.string(),
  directFlights: z.array(z.any()).optional(), // Amadeus flight offers
  multiLegFlights: z.array(z.any()).optional(), // Multi-leg options
  aiRecommendations: aiFlightRecommendationSchema.optional(),
  totalResults: z.number(),
  searchParams: z.any(),
  processingTime: z.object({
    amadeus: z.number().optional(),
    ai: z.number().optional(),
    total: z.number()
  }),
  affiliateUrls: z.record(z.string(), z.string()).optional(), // flightId -> affiliate URL mapping
  metadata: z.object({
    currency: z.string().default("PLN"),
    searchTimestamp: z.string(),
    bestSavings: z.number().optional(),
    totalSavingsFound: z.number().optional()
  })
});

export type VacationPlanRequest = z.infer<typeof vacationPlanRequestSchema>;
export type CityOptimizeRequest = z.infer<typeof cityOptimizeRequestSchema>;
export type BudgetOptimizeRequest = z.infer<typeof budgetOptimizeRequestSchema>;
export type HotelAdvancedRequest = z.infer<typeof hotelAdvancedRequestSchema>;
export type RouteOptimizeRequest = z.infer<typeof routeOptimizeRequestSchema>;
export type VacationPlanResponse = z.infer<typeof vacationPlanResponseSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// NEW: AI-powered flight search types
export type StopoverInsight = z.infer<typeof stopoverInsightSchema>;
export type PriceBand = z.infer<typeof priceBandSchema>;
export type AIFlightRecommendation = z.infer<typeof aiFlightRecommendationSchema>;
export type EnhancedFlightSearchResponse = z.infer<typeof enhancedFlightSearchResponseSchema>;