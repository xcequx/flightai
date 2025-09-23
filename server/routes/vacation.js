import { Router } from 'express';
import { db } from '../db.js';
import { vacationPlans } from '../../shared/schema.js';
import { planVacation, getHotelRecommendations, optimizeFlightRoute } from '../utils/openai.js';
import { desc, eq } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/vacation/plan
 * Generate AI vacation plan based on user preferences
 */
router.post('/plan', async (req, res) => {
  try {
    const { budget, region, duration, travelStyle, interests, departureCity } = req.body;

    // Validate required fields
    if (!budget || !region || !duration || !travelStyle || !departureCity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: budget, region, duration, travelStyle, departureCity'
      });
    }

    console.log('AI Vacation Plan Request:', {
      budget,
      region,
      duration,
      travelStyle,
      interests: interests || [],
      departureCity
    });

    // Generate AI vacation plan with timeout
    console.log('🤖 Generating AI vacation plan...');
    const vacationPlan = await Promise.race([
      planVacation({
        budget: parseFloat(budget),
        region,
        duration: parseInt(duration),
        travelStyle,
        interests: interests || [],
        departureCity
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout - please try again')), 30000)
      )
    ]);

    // Extract destinations from the plan for hotel recommendations
    const destinations = vacationPlan.destinations || [];
    console.log('🏨 Getting hotel recommendations for destinations:', destinations);
    
    let hotelRecommendations = {};
    let flightRouting = {};

    try {
      // Get hotel recommendations
      if (destinations.length > 0) {
        hotelRecommendations = await getHotelRecommendations(
          destinations.map(d => d.name || d),
          parseFloat(budget),
          travelStyle
        );
      }

      // Optimize flight routing
      flightRouting = await optimizeFlightRoute(
        departureCity,
        destinations.map(d => d.name || d),
        parseFloat(budget),
        parseInt(duration)
      );
    } catch (subError) {
      console.warn('Warning: Could not get complete recommendations:', subError.message);
      // Continue with main plan even if sub-recommendations fail
    }

    // Save to database
    try {
      await db.insert(vacationPlans).values({
        budget: budget.toString(),
        region,
        duration: parseInt(duration),
        travelStyle,
        interests: JSON.stringify(interests || []),
        departureCity,
        planData: JSON.stringify(vacationPlan),
        hotelData: JSON.stringify(hotelRecommendations),
        flightData: JSON.stringify(flightRouting)
      });
      console.log('💾 Vacation plan saved to database');
    } catch (dbError) {
      console.warn('Warning: Could not save to database:', dbError.message);
      // Continue even if database save fails
    }

    res.json({
      success: true,
      data: {
        vacationPlan,
        hotelRecommendations,
        flightRouting,
        requestSummary: {
          budget,
          region,
          duration,
          travelStyle,
          interests: interests || [],
          departureCity
        }
      }
    });

  } catch (error) {
    console.error('Error generating vacation plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate vacation plan: ' + error.message
    });
  }
});

/**
 * GET /api/vacation/plans
 * Get user's vacation plan history
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await db
      .select()
      .from(vacationPlans)
      .orderBy(desc(vacationPlans.createdAt))
      .limit(10);

    res.json({
      success: true,
      data: plans.map(plan => ({
        id: plan.id,
        budget: plan.budget,
        region: plan.region,
        duration: plan.duration,
        travelStyle: plan.travelStyle,
        departureCity: plan.departureCity,
        createdAt: plan.createdAt,
        interests: JSON.parse(plan.interests || '[]')
      }))
    });
  } catch (error) {
    console.error('Error fetching vacation plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vacation plans'
    });
  }
});

/**
 * GET /api/vacation/plans/:id
 * Get specific vacation plan with full details
 */
router.get('/plans/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    const [plan] = await db
      .select()
      .from(vacationPlans)
      .where(eq(vacationPlans.id, planId))
      .limit(1);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Vacation plan not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: plan.id,
        budget: plan.budget,
        region: plan.region,
        duration: plan.duration,
        travelStyle: plan.travelStyle,
        departureCity: plan.departureCity,
        interests: JSON.parse(plan.interests || '[]'),
        vacationPlan: JSON.parse(plan.planData || '{}'),
        hotelRecommendations: JSON.parse(plan.hotelData || '{}'),
        flightRouting: JSON.parse(plan.flightData || '{}'),
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching vacation plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vacation plan'
    });
  }
});

export default router;