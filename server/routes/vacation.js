import { Router } from 'express';
import { db } from '../db.js';
import { vacationPlans } from '../../shared/schema.js';
import { 
  planVacation, 
  getHotelRecommendations, 
  optimizeFlightRoute,
  optimizeCitySelection,
  optimizeBudgetAllocation 
} from '../utils/openai.js';
import { 
  vacationPlanRequestSchema,
  cityOptimizeRequestSchema,
  budgetOptimizeRequestSchema,
  hotelAdvancedRequestSchema,
  routeOptimizeRequestSchema,
  apiResponseSchema,
  errorResponseSchema
} from '../../shared/schema.js';
import { desc, eq } from 'drizzle-orm';

const router = Router();

/**
 * Centralized error response handler
 * Ensures all errors return structured JSON responses
 */
function createErrorResponse(res, statusCode, error, details = null, requestId = null) {
  const errorResponse = {
    success: false,
    error: typeof error === 'string' ? error : error.message || 'Unknown error',
    details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : (process.env.NODE_ENV === 'development' ? error.stack : undefined),
    timestamp: new Date().toISOString(),
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  // Validate error response structure
  const validation = errorResponseSchema.safeParse(errorResponse);
  if (!validation.success) {
    console.error('❌ Error response validation failed:', validation.error);
    // Fallback to minimal error response
    return res.status(statusCode).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
  
  console.error(`❌ API Error [${statusCode}]:`, {
    error: errorResponse.error,
    requestId: errorResponse.requestId,
    timestamp: errorResponse.timestamp,
    details: process.env.NODE_ENV === 'development' ? details : 'Hidden in production'
  });
  
  return res.status(statusCode).json(validation.data);
}

/**
 * Centralized success response handler
 * Ensures all successful responses follow consistent structure
 */
function createSuccessResponse(res, data, message = null) {
  const successResponse = {
    success: true,
    data: data,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  // Validate success response structure
  const validation = apiResponseSchema.safeParse(successResponse);
  if (!validation.success) {
    console.error('❌ Success response validation failed:', validation.error);
    // Fallback to minimal success response
    return res.status(200).json({
      success: true,
      data: data || {},
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(200).json(validation.data);
}

/**
 * Validate request body with Zod schema
 * Returns validation result and formatted errors
 */
function validateRequestBody(schema, body) {
  const validation = schema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
      received: issue.received
    }));
    return { valid: false, errors };
  }
  return { valid: true, data: validation.data };
}

/**
 * POST /api/vacation/plan
 * Generate AI vacation plan based on user preferences with robust error handling
 */
router.post('/plan', async (req, res) => {
  const requestId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🚀 Starting vacation plan request [${requestId}]`);
    
    // Validate request body with Zod schema
    const validation = validateRequestBody(vacationPlanRequestSchema, req.body);
    if (!validation.valid) {
      return createErrorResponse(res, 400, 
        'Request validation failed', 
        { validation_errors: validation.errors },
        requestId
      );
    }
    
    const validatedData = validation.data;
    const { 
      budget, 
      region, 
      duration, 
      travelStyle, 
      interests = [],
      departureCity,
      isMultiCity = false,
      travelPace = 'moderate',
      accommodationType = 'hotel',
      transportPreference = 'flights',
      hotelPreferences = {},
      seasonOptimized = true
    } = validatedData;

    const durationNum = parseInt(duration);
    const budgetNum = parseFloat(budget);
    const isLongTrip = durationNum >= 14;
    const isExtendedTrip = durationNum >= 21;

    console.log(`✅ Validated vacation plan request [${requestId}]:`, {
      budget: budgetNum,
      region,
      duration: durationNum,
      travelStyle,
      interests,
      departureCity,
      isMultiCity: isMultiCity || isLongTrip,
      travelPace,
      accommodationType,
      transportPreference,
      tripType: isExtendedTrip ? 'extended' : isLongTrip ? 'long' : 'standard'
    });

    // Generate enhanced AI vacation plan (timeout handled in openai.js)
    console.log(`🤖 Generating enhanced AI vacation plan [${requestId}]...`);
    
    const vacationPlan = await planVacation({
      budget: budgetNum,
      region,
      duration: durationNum,
      travelStyle,
      interests,
      departureCity,
      isMultiCity: isMultiCity || isLongTrip,
      travelPace,
      accommodationType,
      transportPreference
    });
    
    if (!vacationPlan) {
      throw new Error('Failed to generate vacation plan - empty response');
    }

    // Extract destinations from the plan for advanced recommendations
    const destinations = vacationPlan.destinations || [];
    const destinationNames = destinations.map(d => d.name || d).filter(Boolean);
    
    console.log(`🏨 Getting enhanced recommendations for ${destinationNames.length} destinations [${requestId}]:`, destinationNames);
    
    let hotelRecommendations = {};
    let flightRouting = {};
    let budgetOptimization = {};

    try {
      // Parallel processing for enhanced recommendations with individual error handling
      const [hotelResults, flightResults, budgetResults] = await Promise.allSettled([
        // Enhanced hotel recommendations
        destinationNames.length > 0 ? getHotelRecommendations(
          destinationNames,
          budgetNum,
          travelStyle,
          durationNum,
          accommodationType
        ) : Promise.resolve({}),
        
        // Advanced flight routing
        destinationNames.length > 0 ? optimizeFlightRoute(
          departureCity,
          destinationNames,
          budgetNum,
          durationNum,
          travelPace,
          transportPreference
        ) : Promise.resolve({}),
        
        // Budget optimization
        destinationNames.length > 0 ? optimizeBudgetAllocation({
          budget: budgetNum,
          duration: durationNum,
          destinations: destinationNames,
          travelStyle,
          accommodationType,
          transportPreference,
          interests
        }) : Promise.resolve({})
      ]);

      hotelRecommendations = hotelResults.status === 'fulfilled' ? (hotelResults.value || {}) : {};
      flightRouting = flightResults.status === 'fulfilled' ? (flightResults.value || {}) : {};
      budgetOptimization = budgetResults.status === 'fulfilled' ? (budgetResults.value || {}) : {};
      
      console.log(`✅ Enhanced recommendations generated successfully [${requestId}]`);
      
      // Log any failed sub-requests for debugging
      if (hotelResults.status === 'rejected') {
        console.warn(`⚠️ Hotel recommendations failed [${requestId}]:`, hotelResults.reason?.message);
      }
      if (flightResults.status === 'rejected') {
        console.warn(`⚠️ Flight routing failed [${requestId}]:`, flightResults.reason?.message);
      }
      if (budgetResults.status === 'rejected') {
        console.warn(`⚠️ Budget optimization failed [${requestId}]:`, budgetResults.reason?.message);
      }
      
    } catch (subError) {
      console.warn(`⚠️ Error in parallel recommendations [${requestId}]:`, subError.message);
      // Continue with main plan even if sub-recommendations fail
    }

    // Save enhanced plan to database
    try {
      const pricePerDay = budgetOptimization.daily_budgets?.average_daily ? 
        parseFloat(budgetOptimization.daily_budgets.average_daily.replace(/[^0-9.]/g, '')) : 
        Math.round(budgetNum / durationNum);
        
      await db.insert(vacationPlans).values({
        budget: budgetNum.toString(),
        region,
        duration: durationNum,
        travelStyle,
        interests: JSON.stringify(interests),
        departureCity,
        // Enhanced fields
        isMultiCity: isMultiCity || isLongTrip,
        cities: JSON.stringify(destinations),
        budgetAllocation: JSON.stringify(budgetOptimization),
        travelPace,
        accommodationType,
        transportPreference,
        hotelPreferences: JSON.stringify(hotelPreferences || {}),
        pricePerDay: pricePerDay,
        seasonOptimized,
        // Plan data
        planData: JSON.stringify(vacationPlan),
        hotelData: JSON.stringify(hotelRecommendations),
        flightData: JSON.stringify(flightRouting),
        routingData: JSON.stringify(budgetOptimization)
      });
      console.log(`💾 Enhanced vacation plan saved to database [${requestId}]`);
    } catch (dbError) {
      console.warn(`⚠️ Could not save plan to database [${requestId}]:`, dbError.message);
      // Continue even if database save fails - don't fail the entire request
    }

    // Create structured response
    const responseData = {
      vacationPlan: vacationPlan || {},
      hotelRecommendations: hotelRecommendations || {},
      flightRouting: flightRouting || {},
      budgetOptimization: budgetOptimization || {},
      requestSummary: {
        budget: budgetNum,
        region,
        duration: durationNum,
        travelStyle,
        interests,
        departureCity,
        // Enhanced summary
        isMultiCity: isMultiCity || isLongTrip,
        travelPace,
        accommodationType,
        transportPreference,
        tripType: isExtendedTrip ? 'extended' : isLongTrip ? 'long' : 'standard',
        estimatedCities: destinations.length,
        dailyBudget: Math.round(budgetNum / durationNum),
        requestId
      }
    };
    
    console.log(`✅ Vacation plan completed successfully [${requestId}]`);
    return createSuccessResponse(res, responseData, 'Vacation plan generated successfully');

  } catch (error) {
    console.error(`❌ Error generating vacation plan [${requestId}]:`, {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Determine appropriate error status and message
    let statusCode = 500;
    let errorMessage = 'Failed to generate vacation plan';
    
    if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Request timeout - please try again with a simpler request';
    } else if (error.message.includes('API key') || error.message.includes('configuration')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable - configuration error';
    } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
      statusCode = 429;
      errorMessage = 'Service temporarily unavailable - please try again later';
    }
    
    return createErrorResponse(res, statusCode, errorMessage, error.message, requestId);
  }
});

/**
 * GET /api/vacation/plans
 * Get user's vacation plan history with robust error handling
 */
router.get('/plans', async (req, res) => {
  const requestId = `plans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`📋 Fetching vacation plans [${requestId}]`);
    
    const plans = await db
      .select()
      .from(vacationPlans)
      .orderBy(desc(vacationPlans.createdAt))
      .limit(10);

    const formattedPlans = plans.map(plan => {
      try {
        return {
          id: plan.id,
          budget: plan.budget,
          region: plan.region,
          duration: plan.duration,
          travelStyle: plan.travelStyle,
          departureCity: plan.departureCity,
          createdAt: plan.createdAt,
          interests: JSON.parse(plan.interests || '[]'),
          isMultiCity: plan.isMultiCity || false,
          travelPace: plan.travelPace || 'moderate',
          accommodationType: plan.accommodationType || 'hotel'
        };
      } catch (parseError) {
        console.warn(`⚠️ Error parsing plan ${plan.id} [${requestId}]:`, parseError.message);
        return {
          id: plan.id,
          budget: plan.budget,
          region: plan.region,
          duration: plan.duration,
          travelStyle: plan.travelStyle,
          departureCity: plan.departureCity,
          createdAt: plan.createdAt,
          interests: [],
          isMultiCity: false,
          travelPace: 'moderate',
          accommodationType: 'hotel'
        };
      }
    });

    console.log(`✅ Successfully fetched ${formattedPlans.length} vacation plans [${requestId}]`);
    return createSuccessResponse(res, formattedPlans, `Found ${formattedPlans.length} vacation plans`);
    
  } catch (error) {
    console.error(`❌ Error fetching vacation plans [${requestId}]:`, error.message);
    return createErrorResponse(res, 500, 'Failed to fetch vacation plans', error.message, requestId);
  }
});

/**
 * GET /api/vacation/plans/:id
 * Get specific vacation plan with full details and robust error handling
 */
router.get('/plans/:id', async (req, res) => {
  const requestId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId) || planId <= 0) {
      return createErrorResponse(res, 400, 'Invalid plan ID', 'Plan ID must be a positive integer', requestId);
    }
    
    console.log(`📄 Fetching vacation plan ${planId} [${requestId}]`);
    
    const [plan] = await db
      .select()
      .from(vacationPlans)
      .where(eq(vacationPlans.id, planId))
      .limit(1);

    if (!plan) {
      return createErrorResponse(res, 404, 'Vacation plan not found', `No plan found with ID ${planId}`, requestId);
    }

    // Safely parse JSON fields with fallbacks
    const safeParseJSON = (jsonString, fallback = {}) => {
      try {
        return JSON.parse(jsonString || JSON.stringify(fallback));
      } catch (parseError) {
        console.warn(`⚠️ JSON parsing failed for plan ${planId} [${requestId}]:`, parseError.message);
        return fallback;
      }
    };

    const planData = {
      id: plan.id,
      budget: plan.budget,
      region: plan.region,
      duration: plan.duration,
      travelStyle: plan.travelStyle,
      departureCity: plan.departureCity,
      interests: safeParseJSON(plan.interests, []),
      vacationPlan: safeParseJSON(plan.planData, {}),
      hotelRecommendations: safeParseJSON(plan.hotelData, {}),
      flightRouting: safeParseJSON(plan.flightData, {}),
      budgetOptimization: safeParseJSON(plan.routingData, {}),
      // Enhanced fields
      isMultiCity: plan.isMultiCity || false,
      travelPace: plan.travelPace || 'moderate',
      accommodationType: plan.accommodationType || 'hotel',
      transportPreference: plan.transportPreference || 'flights',
      seasonOptimized: plan.seasonOptimized || true,
      pricePerDay: plan.pricePerDay || 0,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };

    console.log(`✅ Successfully fetched vacation plan ${planId} [${requestId}]`);
    return createSuccessResponse(res, planData, 'Vacation plan retrieved successfully');
    
  } catch (error) {
    console.error(`❌ Error fetching vacation plan [${requestId}]:`, error.message);
    return createErrorResponse(res, 500, 'Failed to fetch vacation plan', error.message, requestId);
  }
});

/**
 * POST /api/vacation/optimize-cities
 * Get intelligent city selection recommendations
 */
router.post('/optimize-cities', async (req, res) => {
  const requestId = `cities_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🏙️ City optimization request [${requestId}]`);
    
    // Validate request body
    const validation = validateRequestBody(cityOptimizeRequestSchema, req.body);
    if (!validation.valid) {
      return createErrorResponse(res, 400, 
        'City optimization validation failed', 
        { validation_errors: validation.errors },
        requestId
      );
    }
    
    const { region, budget, duration, interests, travelStyle, departureCity, travelPace } = validation.data;

    const cityRecommendations = await optimizeCitySelection({ 
      region, 
      budget: parseFloat(budget), 
      duration: parseInt(duration), 
      interests, 
      travelStyle, 
      departureCity, 
      travelPace 
    });

    console.log(`✅ City optimization completed [${requestId}]`);
    return createSuccessResponse(res, cityRecommendations, 'City recommendations generated successfully');
    
  } catch (error) {
    console.error(`❌ Error optimizing cities [${requestId}]:`, error.message);
    
    let statusCode = 500;
    let errorMessage = 'Failed to optimize city selection';
    
    if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'City optimization timeout - please try again';
    }
    
    return createErrorResponse(res, statusCode, errorMessage, error.message, requestId);
  }
});

/**
 * POST /api/vacation/optimize-budget
 * Get intelligent budget allocation recommendations
 */
router.post('/optimize-budget', async (req, res) => {
  const requestId = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`💰 Budget optimization request [${requestId}]`);
    
    // Validate request body
    const validation = validateRequestBody(budgetOptimizeRequestSchema, req.body);
    if (!validation.valid) {
      return createErrorResponse(res, 400, 
        'Budget optimization validation failed', 
        { validation_errors: validation.errors },
        requestId
      );
    }
    
    const { destinations, budget, duration, travelStyle, accommodationType } = validation.data;

    const budgetRecommendations = await optimizeBudgetAllocation({ 
      budget: parseFloat(budget), 
      duration: parseInt(duration), 
      destinations, 
      travelStyle, 
      accommodationType,
      transportPreference: 'flights',
      interests: []
    });

    console.log(`✅ Budget optimization completed [${requestId}]`);
    return createSuccessResponse(res, budgetRecommendations, 'Budget optimization completed successfully');
    
  } catch (error) {
    console.error(`❌ Error optimizing budget [${requestId}]:`, error.message);
    
    let statusCode = 500;
    let errorMessage = 'Failed to optimize budget allocation';
    
    if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Budget optimization timeout - please try again';
    }
    
    return createErrorResponse(res, statusCode, errorMessage, error.message, requestId);
  }
});

/**
 * POST /api/vacation/hotels-advanced
 * Get advanced hotel recommendations
 */
router.post('/hotels-advanced', async (req, res) => {
  const requestId = `hotels_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🏨 Advanced hotel recommendations request [${requestId}]`);
    
    // Validate request body
    const validation = validateRequestBody(hotelAdvancedRequestSchema, req.body);
    if (!validation.valid) {
      return createErrorResponse(res, 400, 
        'Hotel recommendations validation failed', 
        { validation_errors: validation.errors },
        requestId
      );
    }
    
    const { destinations, budget, checkIn, checkOut, guests, preferences } = validation.data;
    
    // Calculate duration from check-in/check-out dates
    const checkinDate = new Date(checkIn);
    const checkoutDate = new Date(checkOut);
    const duration = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (duration <= 0) {
      return createErrorResponse(res, 400, 'Invalid date range', 'Check-out date must be after check-in date', requestId);
    }

    const hotelRecommendations = await getHotelRecommendations(
      destinations, 
      parseFloat(budget), 
      preferences.priceRange || 'mid-range', 
      duration,
      'hotel'
    );

    const enhancedResponse = {
      ...hotelRecommendations,
      searchCriteria: {
        destinations,
        checkIn,
        checkOut,
        duration,
        guests,
        budget: parseFloat(budget),
        preferences
      }
    };

    console.log(`✅ Advanced hotel recommendations completed [${requestId}]`);
    return createSuccessResponse(res, enhancedResponse, 'Hotel recommendations generated successfully');
    
  } catch (error) {
    console.error(`❌ Error getting hotel recommendations [${requestId}]:`, error.message);
    
    let statusCode = 500;
    let errorMessage = 'Failed to get hotel recommendations';
    
    if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Hotel search timeout - please try again';
    }
    
    return createErrorResponse(res, statusCode, errorMessage, error.message, requestId);
  }
});

/**
 * POST /api/vacation/routes-optimize
 * Get optimized flight routing recommendations
 */
router.post('/routes-optimize', async (req, res) => {
  const requestId = `routes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`✈️ Route optimization request [${requestId}]`);
    
    // Validate request body
    const validation = validateRequestBody(routeOptimizeRequestSchema, req.body);
    if (!validation.valid) {
      return createErrorResponse(res, 400, 
        'Route optimization validation failed', 
        { validation_errors: validation.errors },
        requestId
      );
    }
    
    const { departureCity, destinations, budget, duration, transportPreference } = validation.data;

    const routeRecommendations = await optimizeFlightRoute(
      departureCity,
      destinations, 
      parseFloat(budget), 
      parseInt(duration),
      'moderate',
      transportPreference
    );

    console.log(`✅ Route optimization completed [${requestId}]`);
    return createSuccessResponse(res, routeRecommendations, 'Route optimization completed successfully');
    
  } catch (error) {
    console.error(`❌ Error optimizing routes [${requestId}]:`, error.message);
    
    let statusCode = 500;
    let errorMessage = 'Failed to optimize routes';
    
    if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Route optimization timeout - please try again';
    }
    
    return createErrorResponse(res, statusCode, errorMessage, error.message, requestId);
  }
});

/**
 * GET /api/vacation/health
 * Health check endpoint with service status
 */
router.get('/health', async (req, res) => {
  const requestId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Check database connectivity
    const dbCheck = await db.select().from(vacationPlans).limit(1);
    
    // Check OpenAI API key
    const openaiConfigured = !!process.env.OPENAI_API_KEY;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        openai: openaiConfigured ? 'configured' : 'missing_api_key'
      },
      version: '1.0.0',
      requestId
    };
    
    return createSuccessResponse(res, healthData, 'Service is healthy');
    
  } catch (error) {
    console.error(`❌ Health check failed [${requestId}]:`, error.message);
    
    const healthData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: error.message.includes('database') ? 'disconnected' : 'unknown',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing_api_key'
      },
      error: error.message,
      requestId
    };
    
    return createErrorResponse(res, 503, 'Service unhealthy', healthData, requestId);
  }
});

export default router;