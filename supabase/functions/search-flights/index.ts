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
    console.log('Flight search request:', JSON.stringify(searchParams, null, 2));

    // Important: Log that we're using TEST environment
    console.log('🚨 USING AMADEUS TEST ENVIRONMENT - Limited test data available');
    console.log('💡 For production data, move to production environment with real API keys');

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
    // Enhanced mapping with more airports and better coverage
    const airportMap: { [key: string]: string[] } = {
      'PL': ['WAW', 'KRK', 'GDN', 'WRO', 'POZ', 'KTW', 'RZE', 'BZG'],
      'TH': ['BKK', 'DMK', 'CNX', 'HKT', 'HDY', 'USM', 'UTP'],
      'JP': ['NRT', 'HND', 'KIX', 'NGO', 'CTS', 'FUK', 'OKA'],
      'SG': ['SIN'],
      'AE': ['DXB', 'AUH', 'SHJ', 'RKT'],
      'TR': ['IST', 'SAW', 'ADB', 'AYT', 'ESB'],
      'DE': ['FRA', 'MUC', 'BER', 'DUS', 'HAM', 'CGN', 'STR'],
      'GB': ['LHR', 'LGW', 'STN', 'MAN', 'BHX', 'EDI', 'GLA'],
      'FR': ['CDG', 'ORY', 'NCE', 'LYS', 'MRS', 'TLS', 'NTE'],
      'IT': ['FCO', 'MXP', 'LIN', 'NAP', 'VCE', 'BGY', 'BLQ'],
      'ES': ['MAD', 'BCN', 'PMI', 'VLC', 'AGP', 'BIO', 'LPA'],
      'NL': ['AMS', 'RTM', 'EIN'],
      'US': ['JFK', 'LAX', 'ORD', 'DFW', 'ATL', 'MIA', 'SFO'],
      'CA': ['YYZ', 'YVR', 'YUL', 'YYC'],
      'AU': ['SYD', 'MEL', 'BNE', 'PER', 'ADL'],
      'IN': ['DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD'],
      'CN': ['PEK', 'PVG', 'CAN', 'SZX', 'CTU', 'XIY'],
      'KR': ['ICN', 'GMP', 'PUS'],
      'VN': ['SGN', 'HAN', 'DAD'],
      'ID': ['CGK', 'DPS', 'SUB', 'MLG'],
      'MY': ['KUL', 'JHB', 'KCH', 'PEN'],
      // Major hubs for connections
      'QA': ['DOH'],
      'EG': ['CAI'],
      'RU': ['SVO', 'DME', 'LED'],
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

    // Enhanced search with multiple origin/destination combinations for better results
    const searchPromises = [];
    
    // If including neighboring countries, expand search
    if (searchParams.includeNeighboringCountries && searchParams.origins.includes('PL')) {
      // Add neighboring countries airports
      originAirports.push(...(airportMap['DE'] || []).slice(0, 2)); // Add German airports
      originAirports.push(...(airportMap['CZ'] || []).slice(0, 1)); // Add Czech airports
    }

    // Limit to first 3 combinations for performance
    const searchCombinations = [];
    for (let i = 0; i < Math.min(originAirports.length, 2); i++) {
      for (let j = 0; j < Math.min(destinationAirports.length, 2); j++) {
        searchCombinations.push({
          origin: originAirports[i],
          destination: destinationAirports[j]
        });
        if (searchCombinations.length >= 2) break;
      }
      if (searchCombinations.length >= 2) break;
    }

    // Search the primary combination (first origin to first destination)
    const primarySearch = searchCombinations[0];
    console.log(`Searching primary route: ${primarySearch.origin} -> ${primarySearch.destination}`);
    
    // Update the URL with the primary search
    flightSearchUrl.searchParams.set('originLocationCode', primarySearch.origin);
    flightSearchUrl.searchParams.set('destinationLocationCode', primarySearch.destination);

    // Format dates for Amadeus API (YYYY-MM-DD format)
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const departureDate = formatDate(searchParams.dateRange.from);
    const returnDate = searchParams.dateRange.to ? formatDate(searchParams.dateRange.to) : null;

    // Build flight search URL with comprehensive parameters  
    const flightSearchUrl = new URL('https://test.api.amadeus.com/v2/shopping/flight-offers');
    
    // Basic required parameters
    flightSearchUrl.searchParams.set('originLocationCode', primarySearch.origin);
    flightSearchUrl.searchParams.set('destinationLocationCode', primarySearch.destination);
    flightSearchUrl.searchParams.set('departureDate', departureDate);
    if (returnDate) {
      flightSearchUrl.searchParams.set('returnDate', returnDate);
    }
    
    // Passenger configuration
    flightSearchUrl.searchParams.set('adults', '1');
    
    // Currency - important for Polish users
    flightSearchUrl.searchParams.set('currencyCode', 'PLN');
    
    // Result limits - reasonable number for test environment
    flightSearchUrl.searchParams.set('max', '50');
    
    // Allow connections for more options
    flightSearchUrl.searchParams.set('nonStop', 'false');
    
    // Travel class
    flightSearchUrl.searchParams.set('travelClass', 'ECONOMY');

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
      console.error('Search URL was:', flightSearchUrl.toString());
      console.error('Request headers:', { 
        'Authorization': `Bearer ${tokenData.access_token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });
      
      // Try to parse error response for more details
      try {
        const errorData = JSON.parse(errorText);
        console.error('Amadeus API Error Details:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      
      throw new Error(`Flight search failed: ${flightResponse.status} - ${errorText}`);
    }

    const flightData = await flightResponse.json();
    console.log(`Found ${flightData.data?.length || 0} flight offers from Amadeus API`);
    
    // Log sample of the returned data for debugging
    if (flightData.data && flightData.data.length > 0) {
      console.log('Sample flight data structure:', JSON.stringify(flightData.data[0], null, 2));
      console.log('Available dictionaries:', Object.keys(flightData.dictionaries || {}));
    } else {
      console.log('No flight data returned. Full response:', JSON.stringify(flightData, null, 2));
    }

    return new Response(JSON.stringify({
      success: true,
      searchParams,
      flights: flightData.data || [],
      meta: flightData.meta || {},
      dictionaries: flightData.dictionaries || {},
      searchInfo: {
        searchedRoute: `${primarySearch.origin} -> ${primarySearch.destination}`,
        searchDate: departureDate,
        returnDate: returnDate,
        totalResults: flightData.data?.length || 0
      }
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