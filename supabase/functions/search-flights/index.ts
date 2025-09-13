import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
}

interface FlightSearchParams {
  origins: string[];
  destinations: string[];
  dateRange: {
    from: string;
    to?: string;
  };
  departureFlex: number;
  returnFlex: number;
  autoRecommendStopovers: boolean;
  includeNeighboringCountries: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const amadeusApiKey = Deno.env.get('AMADEUS_API_KEY');
    const amadeusApiSecret = Deno.env.get('AMADEUS_API_SECRET');

    if (!amadeusApiKey || !amadeusApiSecret) {
      throw new Error('Amadeus API credentials not configured');
    }

    const searchParams: FlightSearchParams = await req.json();
    console.log('Flight search request:', searchParams);

    // Get Amadeus access token
    const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: amadeusApiKey,
        client_secret: amadeusApiSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', errorText);
      throw new Error(`Failed to get Amadeus token: ${tokenResponse.status}`);
    }

    const tokenData: AmadeusTokenResponse = await tokenResponse.json();
    console.log('Successfully obtained Amadeus token');

    // For now, we'll search for flights between the first origin and destination
    // In a real implementation, we'd handle multiple origins/destinations and stopovers
    const origin = searchParams.origins[0];
    const destination = searchParams.destinations[0];

    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    // Convert country codes or region codes to airport codes for Amadeus
    // This is a simplified mapping - in production you'd have a comprehensive database
    const airportMap: { [key: string]: string[] } = {
      'PL': ['WAW', 'KRK', 'GDN'],
      'TH': ['BKK', 'DMK', 'CNX', 'HKT'],
      'JP': ['NRT', 'HND', 'KIX'],
      'SG': ['SIN'],
      'AE': ['DXB', 'AUH'],
      'TR': ['IST', 'SAW'],
      'DE': ['FRA', 'MUC', 'BER'],
      'GB': ['LHR', 'LGW', 'STN'],
      'FR': ['CDG', 'ORY', 'NCE'],
    };

    const getAirportCodes = (code: string): string[] => {
      // If it's already an airport code (3 letters), return it
      if (code.length === 3) return [code];
      // If it's a country code, return mapped airports
      if (airportMap[code]) return airportMap[code];
      // Default fallback
      return ['WAW']; // Default to Warsaw if no mapping found
    };

    const originAirports = getAirportCodes(origin);
    const destinationAirports = getAirportCodes(destination);

    // Search flights for the first available combination
    const originCode = originAirports[0];
    const destinationCode = destinationAirports[0];

    // Format dates for Amadeus API (YYYY-MM-DD format)
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const departureDate = formatDate(searchParams.dateRange.from);
    const returnDate = searchParams.dateRange.to ? formatDate(searchParams.dateRange.to) : null;

    // Build flight search URL
    const flightSearchUrl = new URL('https://test.api.amadeus.com/v2/shopping/flight-offers');
    flightSearchUrl.searchParams.set('originLocationCode', originCode);
    flightSearchUrl.searchParams.set('destinationLocationCode', destinationCode);
    flightSearchUrl.searchParams.set('departureDate', departureDate);
    if (returnDate) {
      flightSearchUrl.searchParams.set('returnDate', returnDate);
    }
    flightSearchUrl.searchParams.set('adults', '1');
    flightSearchUrl.searchParams.set('max', '10');

    console.log('Searching flights:', flightSearchUrl.toString());

    const flightResponse = await fetch(flightSearchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!flightResponse.ok) {
      const errorText = await flightResponse.text();
      console.error('Flight search failed:', errorText);
      throw new Error(`Flight search failed: ${flightResponse.status}`);
    }

    const flightData = await flightResponse.json();
    console.log(`Found ${flightData.data?.length || 0} flight offers`);

    return new Response(JSON.stringify({
      success: true,
      searchParams,
      flights: flightData.data || [],
      meta: flightData.meta || {},
      dictionaries: flightData.dictionaries || {},
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in search-flights function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});