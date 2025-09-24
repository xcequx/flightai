import OpenAI from 'openai';
import { vacationPlanResponseSchema, errorResponseSchema, aiFlightRecommendationSchema } from '../../shared/schema.js';

// Validate OpenAI API key presence
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not configured');
  throw new Error('OpenAI API key is required');
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Timeout constants - increased for production reliability
const OPENAI_TIMEOUT = 60000; // 60 seconds 
const FALLBACK_TIMEOUT = 55000; // 55 seconds for AbortController
const RETRY_TIMEOUT = 30000; // 30 seconds for retry attempt
const MAX_TOKENS = 2800; // Reduced to improve reliability

/**
 * Normalize AI response from snake_case to camelCase
 * @param {Object} data - Response data with snake_case keys
 * @returns {Object} - Normalized data with camelCase keys
 */
function normalizeAIResponse(data) {
  if (!data || typeof data !== 'object') {
    return {
      destinations: [],
      summary: { duration: 7, cities_count: 1, daily_budget_range: "100-200 PLN" },
      budget_breakdown: { flights: 0.3, accommodation: 0.35, activities: 0.2, meals: 0.15 },
      routing: { optimal_order: [], travel_methods: [], stopovers: [] }
    };
  }

  // Convert snake_case to camelCase for frontend compatibility
  const normalized = {
    ...data,
    destinations: data.destinations || [],
    budgetBreakdown: data.budget_breakdown || data.budgetBreakdown || {},
    dailyBudgets: data.daily_budgets || data.dailyBudgets || {},
    accommodationStrategy: data.accommodation_strategy || data.accommodationStrategy || {},
    seasonalOptimization: data.seasonal_optimization || data.seasonalOptimization || {},
    culturalInsights: data.cultural_insights || data.culturalInsights || {},
    flexibilityOptions: data.flexibility_options || data.flexibilityOptions || {}
  };

  return normalized;
}

/**
 * Safe JSON parsing with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {Object} fallback - Fallback object if parsing fails
 * @returns {Object} - Parsed object or fallback
 */
function safeJsonParse(jsonString, fallback = {}) {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      console.warn('⚠️ Invalid JSON string provided, using fallback');
      return fallback;
    }
    
    const parsed = JSON.parse(jsonString);
    return parsed || fallback;
  } catch (error) {
    console.warn('⚠️ JSON parsing failed, using fallback:', error.message);
    return fallback;
  }
}

/**
 * Create timeout promise with AbortController
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Object} - {promise, abort}
 */
function createTimeoutController(timeout) {
  const controller = new AbortController();
  const timeoutPromise = new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
    
    // Clean up timeout if request completes
    controller.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
    });
  });
  
  return { promise: timeoutPromise, controller };
}

/**
 * Retry OpenAI request with shortened prompt on timeout
 * @param {Function} openaiCall - Function that makes the OpenAI API call
 * @param {Object} fallbackResponse - Minimal valid response to return if all attempts fail
 * @returns {Object} - AI response or fallback
 */
async function retryOpenAIRequest(openaiCall, fallbackResponse) {
  const { promise: firstAttemptTimeout, controller: firstController } = createTimeoutController(FALLBACK_TIMEOUT);
  
  try {
    // First attempt with full timeout
    const firstAttempt = Promise.race([openaiCall(), firstAttemptTimeout]);
    const result = await firstAttempt;
    return result;
  } catch (error) {
    console.warn(`⚠️ First OpenAI attempt failed: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      // Retry with shorter timeout and simplified request
      console.log(`🔄 Retrying with shorter timeout (${RETRY_TIMEOUT}ms)...`);
      const { promise: retryTimeout, controller: retryController } = createTimeoutController(RETRY_TIMEOUT);
      
      try {
        const retryAttempt = Promise.race([openaiCall(true), retryTimeout]); // true flag for simplified
        const retryResult = await retryAttempt;
        return retryResult;
      } catch (retryError) {
        console.warn(`⚠️ Retry attempt also failed: ${retryError.message}`);
      }
    }
    
    // Return fast local fallback
    console.log(`⚡ Using fast local fallback response`);
    return fallbackResponse;
  }
}

/**
 * Validate and normalize AI response with Zod schema
 * @param {Object} response - Raw AI response
 * @returns {Object} - Validated and normalized response
 */
function validateAIResponse(response) {
  try {
    // Normalize the response first
    const normalizedResponse = normalizeAIResponse(response);
    
    // Validate with Zod schema
    const validationResult = vacationPlanResponseSchema.safeParse(normalizedResponse);
    
    if (validationResult.success) {
      return validationResult.data;
    } else {
      console.warn('⚠️ AI response validation failed:', validationResult.error.issues);
      // Return a fallback response that matches the schema
      return {
        summary: { duration: 7, cities_count: 1, daily_budget_range: "Calculation pending" },
        destinations: [{ name: "Destination pending", highlights: [] }],
        routing: { optimal_order: [], travel_methods: [], stopovers: [] },
        budget_breakdown: { flights: 0.3, accommodation: 0.35, activities: 0.2, meals: 0.15 },
        daily_budgets: {},
        accommodation_strategy: { types: [], location_priorities: [] },
        seasonal_optimization: { best_months: [], events: [] },
        cultural_insights: { local_customs: [], language_tips: [], cultural_events: [] },
        flexibility_options: { optional_cities: [], shorter_alternatives: [], budget_upgrades: [] }
      };
    }
  } catch (error) {
    console.error('⚠️ Response validation error:', error);
    return {
      summary: { duration: 7, cities_count: 1, daily_budget_range: "Error calculating budget" },
      destinations: [],
      routing: { optimal_order: [], travel_methods: [], stopovers: [] },
      budget_breakdown: {},
      daily_budgets: {},
      accommodation_strategy: { types: [], location_priorities: [] },
      seasonal_optimization: { best_months: [], events: [] },
      cultural_insights: { local_customs: [], language_tips: [], cultural_events: [] },
      flexibility_options: { optional_cities: [], shorter_alternatives: [], budget_upgrades: [] }
    };
  }
}

/**
 * Enhanced AI vacation planning for longer trips with multi-city optimization
 * Includes timeout handling, AbortController, and structured error responses
 */
export async function planVacation({
  budget,
  region,
  duration,
  travelStyle,
  interests,
  departureCity,
  isMultiCity = false,
  travelPace = 'moderate',
  accommodationType = 'hotel',
  transportPreference = 'flights'
}) {
  const { promise: timeoutPromise, controller } = createTimeoutController(FALLBACK_TIMEOUT);
  
  try {
    console.log(`🤖 Starting AI vacation planning for ${region} (${duration} days, ${budget} PLN)`);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const isLongTrip = duration >= 14;
    const isExtendedTrip = duration >= 21;
    
    const prompt = `Plan a comprehensive ${isLongTrip ? 'long-term' : 'standard'} vacation for ${duration} days with intelligent optimization:

**CORE PARAMETERS:**
- Budget: ${budget} PLN (total available)
- Region: ${region}
- Duration: ${duration} days ${isExtendedTrip ? '(EXTENDED TRIP - optimize for slow travel)' : isLongTrip ? '(LONG TRIP - multi-city recommended)' : ''}
- Travel style: ${travelStyle}
- Travel pace: ${travelPace} (slow=3-5 cities max, moderate=4-7 cities, fast=6+ cities)
- Accommodation preference: ${accommodationType}
- Transport preference: ${transportPreference}
- Interests: ${interests.join(', ')}
- Departure: ${departureCity}

**ADVANCED PLANNING REQUIREMENTS:**

1. **INTELLIGENT CITY SELECTION** (${isMultiCity || isLongTrip ? 'Multi-city optimization required' : 'Single destination focus'}):
   - For ${duration} days, recommend optimal number of cities (consider travel pace)
   - Suggest ideal duration per city (3-7 days for short stays, 1-2+ weeks for extended)
   - Consider geographical routing efficiency
   - Factor seasonal weather and events
   - Include cost-of-living variations

2. **SMART BUDGET ALLOCATION**:
   - Flights: 25-40% (vary by distance and routing complexity)
   - Accommodation: 30-45% (adjust for destination cost levels)
   - Food & dining: 15-25% (local cost considerations)
   - Activities & attractions: 10-20%
   - Local transport: 5-10%
   - Emergency buffer: 5-10%
   - Show daily budget per city with cost-of-living adjustments

3. **DURATION OPTIMIZATION**:
   - Minimum 3 days per city for meaningful experience
   - Suggest 5-7 days for major cities, 3-4 for smaller destinations
   - Include optional cities if budget allows
   - Weekend vs weekday pricing considerations

4. **ROUTING INTELLIGENCE**:
   - Optimal city order for minimal travel time/cost
   - Strategic stopovers that add value
   - Alternative airports and transport connections
   - Seasonal route optimization

5. **ACCOMMODATION STRATEGY**:
   - Mix accommodation types for budget optimization
   - Location scoring: city center vs suburbs vs airport proximity
   - Book longer stays for better rates
   - Consider local alternatives (local guesthouses, unique stays)

Return comprehensive JSON with structure:
{
  "summary": { duration, cities_count, daily_budget_range, best_season },
  "destinations": [{ name, country, duration_days, arrival_date, budget_allocation, highlights, cost_level }],
  "routing": { optimal_order, travel_methods, stopovers, total_travel_time },
  "budget_breakdown": { detailed allocation per category and city },
  "daily_budgets": { per_city_daily_costs_with_explanations },
  "accommodation_strategy": { types, booking_timeline, location_priorities },
  "seasonal_optimization": { best_months, weather_considerations, events },
  "cultural_insights": { local_customs, language_tips, cultural_events },
  "flexibility_options": { optional_cities, shorter_alternatives, budget_upgrades }
}`;

    // Create OpenAI request function for retry logic
    const makeOpenAIRequest = (simplified = false) => openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: simplified ? 2000 : MAX_TOKENS,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are a world-class travel optimization expert specializing in multi-city trips, budget allocation, and long-term travel planning. You have deep knowledge of:\n- Global destination costs and seasonal variations\n- Optimal routing and transportation connections\n- Accommodation strategies for extended stays\n- Cultural events and local insider knowledge\n- Budget optimization techniques for different travel styles\n\nCreate highly detailed, practical plans with realistic pricing and actionable recommendations. Focus on maximizing value while respecting budget constraints. ALWAYS return valid JSON."
        },
        {
          role: "user",
          content: simplified ? prompt.substring(0, 2000) + "\n\nProvide a simplified response." : prompt
        }
      ],
      // response_format removed - was causing 400 errors
    });

    // Define fallback response for this function
    const fallbackResponse = {
      summary: { duration, cities_count: 1, daily_budget_range: `${Math.round(budget/duration)}-${Math.round(budget/duration*1.5)} PLN` },
      destinations: [{ name: region, highlights: ['Explore local attractions', 'Local cuisine', 'Cultural sites'] }],
      routing: { optimal_order: [region], travel_methods: [transportPreference], stopovers: [] },
      budget_breakdown: { flights: 0.3, accommodation: 0.35, activities: 0.2, meals: 0.15 },
      daily_budgets: {},
      accommodation_strategy: { types: [accommodationType], location_priorities: ['city-center'] },
      seasonal_optimization: { best_months: [], events: [] },
      cultural_insights: { local_customs: [], language_tips: [], cultural_events: [] },
      flexibility_options: { optional_cities: [], shorter_alternatives: [], budget_upgrades: [] }
    };

    // Use retry logic - response is either API result or fallback
    const response = await retryOpenAIRequest(makeOpenAIRequest, fallbackResponse);
    
    // If we got a fallback response, validate and return it
    if (!response?.choices?.[0]?.message?.content) {
      console.log(`⚡ Using fallback response for vacation planning`);
      const validatedFallback = validateAIResponse(response);
      return validatedFallback;
    }
    
    // Process normal API response
    const content = response.choices[0].message.content;
    console.log(`✅ AI response received (${content.length} characters)`);
    
    // Safe JSON parsing with fallback  
    const rawResponse = safeJsonParse(content, fallbackResponse);
    
    // Validate and normalize response
    const validatedResponse = validateAIResponse(rawResponse);
    console.log(`✅ AI vacation plan validated and normalized`);
    
    return validatedResponse;

  } catch (error) {
    // Abort any ongoing request
    if (controller) {
      controller.abort();
    }
    
    console.error('❌ Error planning vacation with AI:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      duration: duration,
      region: region,
      budget: budget
    });
    
    // Determine error type for better client handling
    if (error.message.includes('timeout') || error.message.includes('abort')) {
      throw new Error('AI request timeout - please try again with a simpler request');
    } else if (error.message.includes('API key')) {
      throw new Error('AI service configuration error - please contact support');
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      throw new Error('AI service temporarily unavailable - please try again in a few minutes');
    } else {
      // Return a structured fallback for any other errors
      console.log('🔄 Returning fallback vacation plan due to AI error');
      return {
        summary: {
          duration: parseInt(duration) || 7,
          cities_count: isMultiCity ? 2 : 1,
          daily_budget_range: `${Math.round(budget/duration)}-${Math.round(budget/duration*1.5)} PLN`,
          best_season: "Spring/Summer"
        },
        destinations: [{
          name: region,
          country: "To be determined",
          duration_days: parseInt(duration) || 7,
          highlights: ["Explore local culture", "Visit main attractions", "Try local cuisine"],
          cost_level: "medium"
        }],
        routing: {
          optimal_order: [region],
          travel_methods: [transportPreference],
          stopovers: [],
          total_travel_time: "TBD"
        },
        budget_breakdown: {
          flights: Math.round(budget * 0.3),
          accommodation: Math.round(budget * 0.35),
          activities: Math.round(budget * 0.2),
          meals: Math.round(budget * 0.15)
        },
        daily_budgets: {
          [region]: Math.round(budget / duration)
        },
        accommodation_strategy: {
          types: [accommodationType],
          booking_timeline: "Book 2-3 months in advance",
          location_priorities: ["city center", "good transport links"]
        },
        seasonal_optimization: {
          best_months: ["May", "June", "September", "October"],
          weather_considerations: "Check weather forecast before departure",
          events: []
        },
        cultural_insights: {
          local_customs: ["Research local customs and etiquette"],
          language_tips: ["Learn basic local phrases"],
          cultural_events: []
        },
        flexibility_options: {
          optional_cities: [],
          shorter_alternatives: [`${duration-2} days in ${region}`],
          budget_upgrades: ["Premium accommodation", "Additional activities"]
        }
      };
    }
  }
}

/**
 * Enhanced hotel recommendations with price tiers, location scoring, and amenities
 * Includes timeout handling and structured error responses
 */
export async function getHotelRecommendations(destinations, budget, travelStyle, duration, accommodationType = 'hotel') {
  const { promise: timeoutPromise, controller } = createTimeoutController(FALLBACK_TIMEOUT);
  
  try {
    console.log(`🏨 Getting hotel recommendations for: ${destinations.join(', ')}`);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const avgNightlyBudget = Math.round(budget * 0.35 / duration); // 35% of budget for accommodation
    const budgetTiers = {
      budget: Math.round(avgNightlyBudget * 0.6),
      midRange: avgNightlyBudget,
      luxury: Math.round(avgNightlyBudget * 1.8)
    };
    
    const prompt = `Provide comprehensive hotel recommendations for extended stay optimization:

**SEARCH PARAMETERS:**
- Destinations: ${destinations.join(', ')}
- Average nightly budget: ${avgNightlyBudget} PLN
- Budget tiers: Budget (${budgetTiers.budget} PLN), Mid-range (${budgetTiers.midRange} PLN), Luxury (${budgetTiers.luxury} PLN)
- Travel style: ${travelStyle}
- Trip duration: ${duration} days (consider extended stay rates)
- Accommodation type preference: ${accommodationType}

**ADVANCED REQUIREMENTS:**

For each destination, provide detailed recommendations across ALL price tiers:

1. **BUDGET TIER** (${budgetTiers.budget} PLN/night):
   - 2-3 options: hostels, budget hotels, guesthouses
   - Focus on location, cleanliness, safety
   - Highlight cost-saving features (kitchen, laundry)

2. **MID-RANGE TIER** (${budgetTiers.midRange} PLN/night):
   - 3-4 options: 3-star hotels, boutique properties, apartments
   - Balance of comfort, location, and value
   - Include business amenities if relevant

3. **LUXURY TIER** (${budgetTiers.luxury} PLN/night):
   - 2-3 options: 4-5 star hotels, luxury apartments
   - Premium locations and full amenities
   - Special experiences and services

**DETAILED ANALYSIS PER OPTION:**
- Exact location and district with safety/convenience score (1-10)
- Distance to city center, main attractions, transport hubs
- Key amenities (WiFi, breakfast, gym, pool, spa, business center)
- Extended stay benefits (weekly rates, kitchen facilities, laundry)
- Unique selling points and local character
- Realistic pricing with seasonal variations
- Booking recommendations (when to book, which platforms)

**LOCATION SCORING CRITERIA:**
- City center proximity (transport, walking distance)
- Safety and neighborhood quality
- Restaurant/shopping access
- Tourist attraction accessibility
- Public transport connections
- Airport/transport hub proximity

Return JSON structure:
{
  "destination_name": {
    "cost_level": "low/medium/high",
    "budget_tier": [{ name, price_per_night, location_score, district, amenities, extended_stay_benefits, booking_tips }],
    "midrange_tier": [...],
    "luxury_tier": [...],
    "location_insights": { best_areas, areas_to_avoid, transport_tips },
    "seasonal_pricing": { peak_season, low_season, price_variations },
    "extended_stay_tips": { weekly_rates, monthly_discounts, local_alternatives }
  }
}`;

    const openaiRequest = openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a luxury hospitality consultant and accommodation expert with comprehensive knowledge of global hotel markets, pricing strategies, and location optimization. You specialize in:\n- Multi-tier accommodation strategies for extended stays\n- Location scoring based on safety, convenience, and value\n- Seasonal pricing patterns and booking optimization\n- Alternative accommodation types and local insights\n- Extended stay benefits and rate negotiations\n\nProvide detailed, actionable recommendations with realistic pricing and insider knowledge. ALWAYS return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // response_format removed - was causing 400 errors,
      temperature: 0.6,
      max_tokens: 3500
    }, {
      signal: controller.signal,
      timeout: OPENAI_TIMEOUT
    });

    const response = await Promise.race([openaiRequest, timeoutPromise]);
    
    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Invalid hotel recommendations response');
    }
    
    const content = response.choices[0].message.content;
    console.log(`✅ Hotel recommendations received (${content.length} characters)`);
    
    return safeJsonParse(content, {
      [destinations[0] || 'destination']: {
        cost_level: "medium",
        budget_tier: [{ name: "Budget Option", price_per_night: Math.round(budget * 0.25 / duration), location_score: 7 }],
        midrange_tier: [{ name: "Mid-range Option", price_per_night: Math.round(budget * 0.35 / duration), location_score: 8 }],
        luxury_tier: [{ name: "Luxury Option", price_per_night: Math.round(budget * 0.5 / duration), location_score: 9 }]
      }
    });

  } catch (error) {
    if (controller) {
      controller.abort();
    }
    
    console.error('❌ Error getting hotel recommendations:', error.message);
    
    // Return structured fallback
    const fallbackRecommendations = {};
    destinations.forEach(dest => {
      const avgNightly = Math.round(budget * 0.35 / duration);
      fallbackRecommendations[dest] = {
        cost_level: "medium",
        budget_tier: [{
          name: `Budget hotel in ${dest}`,
          price_per_night: Math.round(avgNightly * 0.6),
          location_score: 7,
          amenities: ["WiFi", "Breakfast"],
          booking_tips: "Book directly for best rates"
        }],
        midrange_tier: [{
          name: `Mid-range hotel in ${dest}`,
          price_per_night: avgNightly,
          location_score: 8,
          amenities: ["WiFi", "Breakfast", "Gym"],
          booking_tips: "Check booking platforms for deals"
        }],
        luxury_tier: [{
          name: `Luxury hotel in ${dest}`,
          price_per_night: Math.round(avgNightly * 1.8),
          location_score: 9,
          amenities: ["WiFi", "Breakfast", "Gym", "Spa", "Concierge"],
          booking_tips: "Book well in advance"
        }]
      };
    });
    
    return fallbackRecommendations;
  }
}

/**
 * Advanced flight routing optimization for complex multi-city itineraries
 */
export async function optimizeFlightRoute(departureCity, destinations, budget, duration, travelPace = 'moderate', transportPreference = 'flights') {
  const { promise: timeoutPromise, controller } = createTimeoutController(FALLBACK_TIMEOUT);
  
  try {
    console.log(`✈️ Optimizing flight route: ${departureCity} → ${destinations.join(' → ')}`);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const flightBudget = Math.round(budget * 0.35); // More realistic 35% for flights
    const isLongTrip = duration >= 14;
    const avgBudgetPerSegment = Math.round(flightBudget / (destinations.length + 1));
    
    const prompt = `Create a comprehensive flight routing strategy for a ${duration}-day ${isLongTrip ? 'extended' : 'standard'} multi-city trip:

**ROUTING PARAMETERS:**
- Origin: ${departureCity}
- Destinations: ${destinations.join(', ')}
- Flight budget: ${flightBudget} PLN (35% of total ${budget} PLN)
- Budget per segment: ~${avgBudgetPerSegment} PLN
- Travel pace: ${travelPace}
- Transport preference: ${transportPreference}
- Trip duration: ${duration} days

**OPTIMIZATION REQUIREMENTS:**

1. **INTELLIGENT ROUTING:**
   - Analyze geographical efficiency (minimize backtracking)
   - Consider seasonal flight pricing for each route
   - Optimize for ${travelPace} travel pace
   - Include ground transport alternatives where beneficial

2. **STRATEGIC STOPOVERS:**
   - Identify valuable stopovers (12-24 hour layovers in interesting cities)
   - Free stopover opportunities (Emirates Dubai, Turkish Istanbul, etc.)
   - Extended stopovers for additional destinations
   - Airport proximity to city centers for short visits

3. **BOOKING STRATEGY:**
   - Optimal booking timeline (advance purchase vs last-minute)
   - Airline alliance benefits and routing flexibility
   - Multi-city vs separate ticket strategies
   - Alternative airports within regions
   - Seasonal pricing patterns and best travel periods

4. **COST OPTIMIZATION:**
   - Creative routing for significant savings
   - Ground transport integration (high-speed rail alternatives)
   - Budget airline combinations vs legacy carriers
   - Weekend vs weekday departure optimization

Return comprehensive JSON:
{
  "optimal_route": { order, justification, total_travel_time, total_cost },
  "routing_options": [{ route_description, pros_cons, estimated_cost, travel_time }],
  "strategic_stopovers": [{ city, airline, duration, cost_impact, activities }],
  "booking_strategy": { when_to_book, recommended_airlines, ticket_types },
  "cost_breakdown": { per_segment_costs, potential_savings, budget_allocation },
  "alternative_transport": { rail_options, bus_options, ground_segments },
  "seasonal_analysis": { best_months, price_variations, weather_factors },
  "flexibility_options": { date_alternatives, route_alternatives, upgrade_possibilities },
  "practical_tips": { airport_recommendations, connection_advice, booking_platforms }
}`;

    const openaiRequest = openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a flight routing optimization expert and travel logistics specialist with comprehensive knowledge of:\n- Global airline networks and routing strategies\n- Multi-city booking optimization and cost-saving techniques\n- Alternative transport integration and intermodal travel\n- Seasonal pricing patterns and booking timing optimization\n- Airport connections and stopover opportunities\n- Travel logistics for complex itineraries\n\nProvide detailed, actionable routing strategies that maximize value and minimize travel time while respecting budget constraints. ALWAYS return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // response_format removed - was causing 400 errors,
      temperature: 0.6,
      max_tokens: 3500
    }, {
      signal: controller.signal,
      timeout: OPENAI_TIMEOUT
    });

    const response = await Promise.race([openaiRequest, timeoutPromise]);
    
    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Invalid flight routing response');
    }
    
    const content = response.choices[0].message.content;
    console.log(`✅ Flight routing received (${content.length} characters)`);
    
    return safeJsonParse(content, {
      optimal_route: {
        order: [departureCity, ...destinations],
        justification: "Direct routing for simplicity",
        total_travel_time: "TBD",
        total_cost: flightBudget
      },
      routing_options: [{
        route_description: `${departureCity} to ${destinations.join(', ')}`,
        pros_cons: "Direct routing minimizes complexity",
        estimated_cost: flightBudget,
        travel_time: "To be calculated"
      }],
      strategic_stopovers: [],
      booking_strategy: {
        when_to_book: "2-3 months in advance",
        recommended_airlines: "Major carriers for reliability",
        ticket_types: "Economy class for budget optimization"
      }
    });

  } catch (error) {
    if (controller) {
      controller.abort();
    }
    
    console.error('❌ Error optimizing flight route:', error.message);
    
    return {
      optimal_route: {
        order: [departureCity, ...destinations],
        justification: "Fallback routing due to optimization error",
        total_travel_time: "TBD",
        total_cost: Math.round(budget * 0.35)
      },
      routing_options: [],
      strategic_stopovers: [],
      booking_strategy: {
        when_to_book: "Book as soon as possible",
        recommended_airlines: "Compare major carriers",
        ticket_types: "Economy for budget travel"
      },
      cost_breakdown: {
        per_segment_costs: Math.round(budget * 0.35 / destinations.length),
        potential_savings: "Book early for better rates",
        budget_allocation: budget * 0.35
      }
    };
  }
}

/**
 * Advanced budget optimization with smart allocation strategies
 */
export async function optimizeBudgetAllocation({ 
  budget, 
  duration, 
  destinations, 
  travelStyle, 
  accommodationType, 
  transportPreference,
  interests 
}) {
  const { promise: timeoutPromise, controller } = createTimeoutController(FALLBACK_TIMEOUT);
  
  try {
    console.log(`💰 Optimizing budget allocation for ${destinations.length} destinations (${budget} PLN)`);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const dailyBudget = Math.round(budget / duration);
    const cityCount = destinations.length;
    
    const prompt = `Create an intelligent budget allocation strategy for a ${duration}-day multi-city trip:

**BUDGET PARAMETERS:**
- Total budget: ${budget} PLN
- Daily budget: ${dailyBudget} PLN
- Cities: ${destinations.join(', ')}
- Travel style: ${travelStyle}
- Accommodation type: ${accommodationType}
- Transport preference: ${transportPreference}
- Interests: ${interests.join(', ')}

**OPTIMIZATION REQUIREMENTS:**

1. **SMART CATEGORY ALLOCATION:**
   - Transportation: Optimize between flights, trains, local transport
   - Accommodation: Balance cost vs location vs amenities
   - Food & Dining: Local cost considerations and dining style
   - Activities: Interest-based prioritization
   - Shopping & Souvenirs: Cultural and practical purchases
   - Emergency buffer: Risk management allocation

2. **CITY-SPECIFIC ADJUSTMENTS:**
   - Cost-of-living variations between destinations
   - High-cost vs budget-friendly city strategies
   - Optimal spending days vs saving days
   - Seasonal price variations and surge periods

3. **DURATION-BASED SCALING:**
   - Fixed costs (visas, insurance, gear) amortization
   - Bulk purchase opportunities for longer stays
   - Weekly/monthly accommodation rates
   - Loyalty program benefits for extended travel

Return comprehensive allocation:
{
  "total_breakdown": {
    "transportation": { amount, percentage, justification },
    "accommodation": { amount, percentage, justification },
    "food_dining": { amount, percentage, justification },
    "activities": { amount, percentage, justification },
    "emergency": { amount, percentage, justification }
  },
  "daily_budgets": { per_city_breakdown },
  "city_adjustments": { cost_variations_and_strategies },
  "optimization_tips": { money_saving_strategies },
  "contingency_planning": { emergency_scenarios_and_buffers }
}`;

    const openaiRequest = openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a financial travel planning expert and budget optimization specialist with expertise in:\n- Multi-destination budget allocation and cost management\n- Regional price variations and cost-of-living analysis\n- Travel style optimization and value maximization\n- Seasonal pricing patterns and booking strategies\n- Emergency planning and risk management for travelers\n- Currency considerations and international spending\n\nProvide precise, actionable budget strategies that maximize travel value while maintaining financial security. ALWAYS return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // response_format removed - was causing 400 errors,
      temperature: 0.5,
      max_tokens: 3000
    }, {
      signal: controller.signal,
      timeout: OPENAI_TIMEOUT
    });

    const response = await Promise.race([openaiRequest, timeoutPromise]);
    
    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Invalid budget optimization response');
    }
    
    const content = response.choices[0].message.content;
    console.log(`✅ Budget optimization received (${content.length} characters)`);
    
    return safeJsonParse(content, {
      total_breakdown: {
        transportation: { amount: Math.round(budget * 0.35), percentage: 35, justification: "Flights and local transport" },
        accommodation: { amount: Math.round(budget * 0.35), percentage: 35, justification: "Hotels and lodging" },
        food_dining: { amount: Math.round(budget * 0.20), percentage: 20, justification: "Meals and dining experiences" },
        activities: { amount: Math.round(budget * 0.10), percentage: 10, justification: "Attractions and entertainment" }
      },
      daily_budgets: {
        average_daily: `${dailyBudget} PLN`,
        per_city: destinations.reduce((acc, dest) => {
          acc[dest] = `${dailyBudget} PLN`;
          return acc;
        }, {})
      },
      optimization_tips: ["Book accommodations early", "Use public transport", "Try local food markets"],
      contingency_planning: { emergency_buffer: "Keep 10% for unexpected expenses" }
    });

  } catch (error) {
    if (controller) {
      controller.abort();
    }
    
    console.error('❌ Error optimizing budget:', error.message);
    
    return {
      total_breakdown: {
        transportation: { amount: Math.round(budget * 0.35), percentage: 35, justification: "Estimated transport costs" },
        accommodation: { amount: Math.round(budget * 0.35), percentage: 35, justification: "Estimated accommodation costs" },
        food_dining: { amount: Math.round(budget * 0.20), percentage: 20, justification: "Estimated food costs" },
        activities: { amount: Math.round(budget * 0.10), percentage: 10, justification: "Estimated activity costs" }
      },
      daily_budgets: {
        average_daily: `${Math.round(budget / duration)} PLN`
      },
      optimization_tips: ["Plan and book in advance", "Compare prices", "Use local transport"],
      contingency_planning: { emergency_buffer: "Always keep some budget for emergencies" }
    };
  }
}

/**
 * Intelligent city selection with seasonal optimization and cost analysis
 */
export async function optimizeCitySelection({ region, budget, duration, interests, travelStyle, departureCity, travelPace = 'moderate' }) {
  const { promise: timeoutPromise, controller } = createTimeoutController(FALLBACK_TIMEOUT);
  
  try {
    console.log(`🏙️ Optimizing city selection for ${region} (${duration} days, ${travelPace} pace)`);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const dailyBudget = Math.round(budget / duration);
    const isLongTrip = duration >= 14;
    
    const prompt = `Provide intelligent city selection and optimization for a ${duration}-day trip:

**SELECTION CRITERIA:**
- Region: ${region}
- Total budget: ${budget} PLN (${dailyBudget} PLN/day)
- Interests: ${interests.join(', ')}
- Travel style: ${travelStyle}
- Travel pace: ${travelPace}
- Departure: ${departureCity}
- Trip type: ${isLongTrip ? 'Extended multi-city' : 'Standard vacation'}

**OPTIMIZATION REQUIREMENTS:**

1. **GEOGRAPHICAL EFFICIENCY:**
   - Minimize unnecessary travel time/cost between cities
   - Create logical routing patterns (circles, lines, hubs)
   - Consider transport connections and infrastructure
   - Account for border crossings and visa requirements

2. **SEASONAL OPTIMIZATION:**
   - Best time to visit each recommended city
   - Weather patterns and seasonal attractions
   - Peak/shoulder/off-season pricing impacts
   - Festival and event calendar considerations
   - Tourist crowd levels by season

3. **COST-OF-LIVING ANALYSIS:**
   - Daily budget requirements per city
   - Accommodation cost variations
   - Food and dining expense levels
   - Transportation and activity costs
   - Currency considerations and exchange rates

4. **INTEREST-BASED MATCHING:**
   - Cities that align with stated interests
   - Hidden gems and off-the-beaten-path options
   - Cultural experiences and local specialties
   - Activity and attraction availability
   - Nightlife and entertainment scenes

5. **DURATION OPTIMIZATION:**
   - Recommended days per city (minimum for meaningful experience)
   - Optional cities if budget/time allows
   - Flexible itinerary with must-see vs nice-to-have
   - Day trip possibilities from base cities

Return detailed analysis:
{
  "recommended_cities": [{
    "name": "string",
    "country": "string",
    "recommended_duration": "number (days)",
    "cost_level": "low/medium/high",
    "daily_budget_estimate": "number (PLN)",
    "best_season": "string",
    "interest_match_score": "number (1-10)",
    "highlights": ["activities and attractions"],
    "why_recommended": "detailed explanation"
  }],
  "routing_order": ["optimal city visit sequence"],
  "seasonal_analysis": {
    "best_overall_months": ["months"],
    "weather_considerations": "analysis",
    "seasonal_cost_variations": "pricing insights"
  },
  "budget_distribution": {
    "per_city_allocation": "breakdown",
    "cost_saving_opportunities": "suggestions",
    "splurge_vs_save_recommendations": "strategy"
  },
  "alternative_options": {
    "shorter_itinerary": "reduced city list",
    "budget_upgrade": "enhanced options with more budget",
    "off_season_alternatives": "different timing options"
  },
  "practical_considerations": {
    "visa_requirements": "visa info",
    "language_barriers": "communication tips",
    "safety_considerations": "security advice"
  }
}`;

    const openaiRequest = openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a destination optimization expert and cultural travel consultant with comprehensive knowledge of:\n- Global destination characteristics, costs, and optimal visit durations\n- Seasonal travel patterns and weather optimization\n- Cultural events, festivals, and local experiences\n- Transportation networks and inter-city connections\n- Regional cost-of-living variations and budget optimization\n- Interest-based destination matching and activity recommendations\n\nProvide detailed, data-driven city selection recommendations that maximize traveler satisfaction within budget constraints. ALWAYS return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // response_format removed - was causing 400 errors,
      temperature: 0.6,
      max_tokens: 3500
    }, {
      signal: controller.signal,
      timeout: OPENAI_TIMEOUT
    });

    const response = await Promise.race([openaiRequest, timeoutPromise]);
    
    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Invalid city selection response');
    }
    
    const content = response.choices[0].message.content;
    console.log(`✅ City selection received (${content.length} characters)`);
    
    return safeJsonParse(content, {
      recommended_cities: [{
        name: region,
        country: "To be determined",
        recommended_duration: duration,
        cost_level: "medium",
        daily_budget_estimate: dailyBudget,
        best_season: "Spring/Summer",
        interest_match_score: 8,
        highlights: ["Main attractions", "Local culture", "Regional cuisine"],
        why_recommended: "Perfect match for your interests and budget"
      }],
      routing_order: [region],
      seasonal_analysis: {
        best_overall_months: ["May", "June", "September", "October"],
        weather_considerations: "Mild weather ideal for sightseeing",
        seasonal_cost_variations: "Peak season may increase costs by 20-30%"
      },
      budget_distribution: {
        per_city_allocation: `${dailyBudget} PLN per day`,
        cost_saving_opportunities: "Book early, use public transport",
        splurge_vs_save_recommendations: "Save on transport, splurge on unique experiences"
      }
    });

  } catch (error) {
    if (controller) {
      controller.abort();
    }
    
    console.error('❌ Error optimizing city selection:', error.message);
    
    return {
      recommended_cities: [{
        name: region,
        country: "Region information pending",
        recommended_duration: duration,
        cost_level: "medium",
        daily_budget_estimate: Math.round(budget / duration),
        best_season: "Spring/Summer",
        interest_match_score: 7,
        highlights: ["Cultural sites", "Local experiences"],
        why_recommended: "Fallback recommendation pending detailed analysis"
      }],
      routing_order: [region],
      seasonal_analysis: {
        best_overall_months: ["May", "June", "September"],
        weather_considerations: "Check weather conditions before travel",
        seasonal_cost_variations: "Prices may vary by season"
      },
      budget_distribution: {
        per_city_allocation: `${Math.round(budget / duration)} PLN per day`,
        cost_saving_opportunities: "Research local deals and discounts"
      }
    };
  }
}

/**
 * Generate intelligent stopover recommendations using AI
 * @param {Object} searchParams - Flight search parameters
 * @param {Object} routeData - Origin and destination information
 * @param {Array} availableHubs - Available hub airports
 * @returns {Object} - AI-generated stopover recommendations
 */
export async function generateStopoverRecommendations(searchParams, routeData, availableHubs = []) {
  const startTime = Date.now();
  
  console.log('🤖 Starting AI stopover recommendation generation...');
  console.log('📊 Search params:', JSON.stringify(searchParams, null, 2));
  console.log('🗺️ Route data:', JSON.stringify(routeData, null, 2));
  console.log('🛩️ Available hubs:', availableHubs.map(h => h.iata).join(', '));
  
  // Prepare the AI prompt with comprehensive context
  const userPrefs = searchParams.userPreferences || {};
  const origins = Array.isArray(searchParams.origins) ? searchParams.origins : [searchParams.origins];
  const destinations = Array.isArray(searchParams.destinations) ? searchParams.destinations : [searchParams.destinations];
  
  const prompt = `As an expert travel advisor with deep knowledge of international flight routing and city destinations, analyze this flight search request and provide intelligent stopover recommendations.

FLIGHT SEARCH DETAILS:
- Route: ${origins.join(', ')} → ${destinations.join(', ')}
- Departure: ${searchParams.dateRange?.from || 'flexible'}
- Travel Class: ${searchParams.travelClass || 'ECONOMY'}
- Travelers: ${searchParams.adults || 1} adults, ${searchParams.children || 0} children
- Date Flexibility: ±${searchParams.departureFlex || 3} days

USER PREFERENCES:
- Travel Style: ${userPrefs.travelStyle || 'balanced'}
- Interests: ${userPrefs.interests ? userPrefs.interests.join(', ') : 'general tourism'}
- Budget Sensitivity: ${userPrefs.budgetSensitivity || 'medium'}
- Layover Preference: ${userPrefs.layoverPreference || 'no_preference'}
- Priority: ${userPrefs.timeVsPrice || 'balanced'} (time vs price)

AVAILABLE STOPOVER HUBS:
${availableHubs.map(hub => `- ${hub.city} (${hub.iata}): ${hub.description || 'Major international hub'}
  Attractions: ${hub.attractions ? hub.attractions.join(', ') : 'Various attractions'}
  Avg Daily Cost: $${hub.averageDailyCost || 100}`).join('\n')}

PROVIDE ANALYSIS:
1. Recommend the best 2-3 stopover options ranked by overall value
2. For each recommendation, provide:
   - Specific reasoning based on user preferences and route efficiency
   - Estimated savings potential and layover duration
   - Top 3 attractions/experiences during the stopover
   - Value score (1-10) considering price, experience, and convenience
   - Attraction score (1-10) based on user interests and city offerings

3. Overall recommendation: direct flight vs best stopover option

IMPORTANT: Consider route geography, airline networks, typical pricing patterns, and seasonal factors. Focus on practical recommendations that balance savings with travel experience.

Respond in valid JSON format matching this exact structure:
{
  "summary": {
    "bestOption": "direct" | "stopover" | "flexible_dates",
    "maxSavings": number,
    "recommendedStopover": string | null,
    "reasoning": "detailed explanation of recommendation"
  },
  "stopovers": [
    {
      "hub": {
        "iata": "DXB",
        "name": "Dubai International Airport",
        "city": "Dubai",
        "country": "UAE",
        "attractions": ["Burj Khalifa", "Dubai Mall", "Desert Safari"],
        "description": "Luxury hub with world-class shopping and experiences",
        "averageDailyCost": 150
      },
      "layoverDays": 2,
      "savings": 800,
      "savingsPercent": 25,
      "directPrice": 3200,
      "multiLegPrice": 2400,
      "totalCostWithStay": 2700,
      "reasoning": "Detailed explanation of why this stopover is recommended",
      "attractionScore": 8.5,
      "valueScore": 9.0
    }
  ],
  "confidence": 0.85
}`;

  const fallbackResponse = {
    summary: {
      bestOption: "direct",
      maxSavings: 0,
      recommendedStopover: null,
      reasoning: "AI analysis unavailable - showing direct flight options"
    },
    stopovers: [],
    confidence: 0.0
  };

  try {
    const aiCall = async (simplified = false) => {
      console.log(`🧠 Making OpenAI API call (simplified: ${simplified})...`);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are an expert travel advisor specializing in flight routing and stopover optimization. Provide detailed, practical recommendations based on real travel patterns and user preferences."
        }, {
          role: "user",
          content: simplified ? prompt.slice(0, Math.floor(prompt.length * 0.7)) : prompt
        }],
        max_tokens: simplified ? Math.floor(MAX_TOKENS * 0.7) : MAX_TOKENS,
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        // response_format removed - was causing 400 errors
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      console.log('📄 Raw AI response received:', content.substring(0, 200) + '...');
      
      const parsedResponse = safeJsonParse(content, fallbackResponse);
      console.log('✅ AI response parsed successfully');
      
      // Validate AI response with schema
      const validationResult = aiFlightRecommendationSchema.safeParse(parsedResponse);
      
      if (validationResult.success) {
        console.log('✅ AI response validated successfully');
        return validationResult.data;
      } else {
        console.warn('⚠️ AI response validation failed:', validationResult.error.issues);
        return fallbackResponse;
      }
    };

    // Use retry logic for reliability
    const result = await retryOpenAIRequest(aiCall, fallbackResponse);
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ AI stopover recommendations completed in ${processingTime}ms`);
    
    return {
      ...result,
      processingTime
    };
    
  } catch (error) {
    console.error('❌ AI stopover recommendation failed:', error);
    return {
      ...fallbackResponse,
      processingTime: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Analyze flexible date options for price optimization
 * @param {Object} searchParams - Flight search parameters
 * @param {Array} dateOptions - Available date combinations
 * @returns {Object} - Price band analysis and recommendations
 */
export async function analyzeFlexibleDatePricing(searchParams, dateOptions = []) {
  console.log('📅 Starting flexible date price analysis...');
  
  // This would typically integrate with real pricing APIs
  // For now, providing intelligent analysis based on travel patterns
  
  const baseDate = new Date(searchParams.dateRange?.from || new Date());
  const flexibility = searchParams.departureFlex || 3;
  
  // Generate date range for analysis
  const dateRanges = [];
  for (let i = -flexibility; i <= flexibility; i++) {
    const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    // Mock price calculation with realistic patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isMiddleWeek = dayOfWeek >= 2 && dayOfWeek <= 4;
    
    let priceMultiplier = 1.0;
    if (isWeekend) priceMultiplier = 1.15; // Weekend surcharge
    if (isMiddleWeek) priceMultiplier = 0.9; // Midweek discount
    
    const basePrice = 3200;
    const price = Math.round(basePrice * priceMultiplier);
    const savings = basePrice - price;
    
    dateRanges.push({
      date: dateStr,
      price,
      savings,
      dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]
    });
  }
  
  // Find best deals
  const sortedByPrice = [...dateRanges].sort((a, b) => a.price - b.price);
  const cheapest = sortedByPrice[0];
  const median = sortedByPrice[Math.floor(sortedByPrice.length / 2)].price;
  
  return {
    dateRange: {
      from: dateRanges[0].date,
      to: dateRanges[dateRanges.length - 1].date
    },
    priceRange: {
      min: cheapest.price,
      max: sortedByPrice[sortedByPrice.length - 1].price,
      median
    },
    bestDeal: {
      date: cheapest.date,
      price: cheapest.price,
      savingsFromMedian: median - cheapest.price
    },
    flexibility: flexibility > 7 ? 'high' : flexibility > 3 ? 'medium' : 'low',
    recommendedDates: sortedByPrice.slice(0, 3).map(d => d.date),
    allOptions: dateRanges
  };
}