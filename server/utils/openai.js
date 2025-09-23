import OpenAI from 'openai';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Plan AI vacation based on budget, destination preferences and travel style
 */
export async function planVacation({
  budget,
  region,
  duration,
  travelStyle,
  interests,
  departureCity
}) {
  try {
    const prompt = `Plan a complete vacation itinerary based on these preferences:
- Budget: ${budget} PLN (total budget)
- Region: ${region}
- Duration: ${duration} days
- Travel style: ${travelStyle}
- Interests: ${interests.join(', ')}
- Departure city: ${departureCity}

Please create a detailed vacation plan including:
1. Recommended destinations within the region
2. Flight routing strategy (including beneficial stopovers)
3. Accommodation recommendations with price ranges
4. Daily itinerary suggestions
5. Budget breakdown (flights, hotels, activities, meals)
6. Best travel dates considering seasonality
7. Cultural tips and local experiences

Respond with a JSON object containing all this information in a structured format.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for reliable availability and faster responses
      messages: [
        {
          role: "system",
          content: "You are an expert travel planner with deep knowledge of global destinations, flight routing, and budget optimization. Create detailed, practical vacation plans."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error planning vacation with AI:', error);
    throw new Error('Failed to generate vacation plan: ' + error.message);
  }
}

/**
 * Get hotel recommendations for specific cities
 */
export async function getHotelRecommendations(destinations, budget, travelStyle) {
  try {
    const prompt = `Recommend hotels for the following destinations based on budget and travel style:
- Destinations: ${destinations.join(', ')}
- Budget per night: ${Math.round(budget / 10)} PLN (estimated per night)
- Travel style: ${travelStyle}

For each destination, provide:
1. 3-5 hotel recommendations in different price ranges
2. Brief description and key amenities
3. Approximate price per night
4. Location/district information
5. Booking tips

Return as JSON with destinations as keys and hotel arrays as values.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a hotel booking expert with knowledge of accommodations worldwide. Provide practical, bookable hotel recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error getting hotel recommendations:', error);
    throw new Error('Failed to get hotel recommendations: ' + error.message);
  }
}

/**
 * Optimize flight routing with stopovers for vacation
 */
export async function optimizeFlightRoute(departureCity, destinations, budget, duration) {
  try {
    const prompt = `Optimize flight routing for a multi-destination vacation:
- Departure: ${departureCity}
- Destinations: ${destinations.join(', ')}
- Flight budget: ${Math.round(budget * 0.4)} PLN (40% of total budget)
- Trip duration: ${duration} days

Create optimal flight routing strategy including:
1. Best order to visit destinations
2. Recommended stopovers that add value
3. Flight booking strategy (when to book, which airlines)
4. Alternative airports to consider
5. Potential cost savings with creative routing
6. Best travel dates for pricing

Respond with JSON containing the routing strategy.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a flight routing expert specializing in multi-city trips and stopover optimization. Focus on practical, bookable solutions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error optimizing flight route:', error);
    throw new Error('Failed to optimize flight route: ' + error.message);
  }
}