import { Router } from 'express';
import { db } from '../db.js';
import { flightSearches, flightSearchSchema, FlightSearchRequest } from '../../shared/schema.js';

const router = Router();

interface AviationstackResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: AviationstackFlight[];
}

interface AviationstackFlight {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight: {
    number: string;
    iata: string;
    icao: string;
  };
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

// Mock data for fallback
const generateMockFlights = (searchParams: FlightSearchParams) => {
  const origin = searchParams.origins[0] || 'WAW';
  const destination = searchParams.destinations[0] || 'BKK';
  
  return [
    {
      id: "mock-1",
      price: { total: "2150", currency: "PLN" },
      itineraries: [{
        duration: "PT18H45M",
        segments: [{
          departure: { iataCode: origin.length === 3 ? origin : 'WAW', at: `${searchParams.dateRange.from}T10:30:00` },
          arrival: { iataCode: 'DOH', at: `${searchParams.dateRange.from}T18:45:00` },
          carrierCode: 'QR',
          number: '201',
          aircraft: { code: '359' },
          duration: "PT8H15M"
        }, {
          departure: { iataCode: 'DOH', at: `${searchParams.dateRange.from}T20:30:00` },
          arrival: { iataCode: destination.length === 3 ? destination : 'BKK', at: `${new Date(new Date(searchParams.dateRange.from).getTime() + 24*60*60*1000).toISOString().split('T')[0]}T08:15:00` },
          carrierCode: 'QR',
          number: '837',
          aircraft: { code: '77W' },
          duration: "PT6H45M"
        }]
      }],
      travelerPricings: [{
        fareOption: "STANDARD",
        travelerType: "ADULT",
        price: { total: "2150", currency: "PLN" }
      }]
    },
    {
      id: "mock-2", 
      price: { total: "1850", currency: "PLN" },
      itineraries: [{
        duration: "PT22H30M",
        segments: [{
          departure: { iataCode: origin.length === 3 ? origin : 'WAW', at: `${searchParams.dateRange.from}T14:20:00` },
          arrival: { iataCode: 'IST', at: `${searchParams.dateRange.from}T18:35:00` },
          carrierCode: 'TK',
          number: '1853',
          aircraft: { code: '73J' },
          duration: "PT4H15M"
        }, {
          departure: { iataCode: 'IST', at: `${new Date(new Date(searchParams.dateRange.from).getTime() + 24*60*60*1000).toISOString().split('T')[0]}T02:40:00` },
          arrival: { iataCode: destination.length === 3 ? destination : 'BKK', at: `${new Date(new Date(searchParams.dateRange.from).getTime() + 24*60*60*1000).toISOString().split('T')[0]}T14:15:00` },
          carrierCode: 'TK',
          number: '69',
          aircraft: { code: '77W' },
          duration: "PT9H35M"
        }]
      }],
      travelerPricings: [{
        fareOption: "STANDARD",
        travelerType: "ADULT",
        price: { total: "1850", currency: "PLN" }
      }]
    },
    {
      id: "mock-3",
      price: { total: "2380", currency: "PLN" },
      itineraries: [{
        duration: "PT16H20M",
        segments: [{
          departure: { iataCode: origin.length === 3 ? origin : 'WAW', at: `${searchParams.dateRange.from}T08:00:00` },
          arrival: { iataCode: 'DXB', at: `${searchParams.dateRange.from}T15:45:00` },
          carrierCode: 'EK',
          number: '183',
          aircraft: { code: '77W' },
          duration: "PT7H45M"
        }, {
          departure: { iataCode: 'DXB', at: `${searchParams.dateRange.from}T20:15:00` },
          arrival: { iataCode: destination.length === 3 ? destination : 'BKK', at: `${new Date(new Date(searchParams.dateRange.from).getTime() + 24*60*60*1000).toISOString().split('T')[0]}T02:35:00` },
          carrierCode: 'EK',
          number: '384',
          aircraft: { code: 'A38' },
          duration: "PT6H20M"
        }]
      }],
      travelerPricings: [{
        fareOption: "STANDARD",
        travelerType: "ADULT",
        price: { total: "2380", currency: "PLN" }
      }]
    }
  ];
};

router.post('/search', async (req, res) => {
  try {
    // Validate request body with Zod
    const validation = flightSearchSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      });
    }

    const searchParams: FlightSearchRequest = validation.data;
    const aviationstackApiKey = process.env.AVIATIONSTACK_API_KEY;
    console.log('🔍 Flight search request:', JSON.stringify(searchParams, null, 2));

    // Enhanced airport mapping for better coverage
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
      'QA': ['DOH'],
      'EG': ['CAI'],
      'RU': ['SVO', 'DME', 'LED'],
      'CZ': ['PRG', 'BRQ'],
      'SK': ['BTS'],
      'AT': ['VIE', 'SZG', 'INN'],
      'CH': ['ZUR', 'GVA', 'BSL'],
      'BE': ['BRU', 'ANR', 'CRL'],
      'DK': ['CPH', 'AAL', 'BLL'],
      'SE': ['ARN', 'GOT', 'MMX'],
      'NO': ['OSL', 'BGO', 'TRD'],
      'FI': ['HEL', 'TMP', 'OUL'],
      'PT': ['LIS', 'OPO', 'FAO'],
      'IE': ['DUB', 'ORK', 'SNN'],
      'GR': ['ATH', 'SKG', 'HER'],
      'HR': ['ZAG', 'SPU', 'DBV'],
      'SI': ['LJU'],
      'HU': ['BUD'],
      'RO': ['OTP', 'CLJ'],
      'BG': ['SOF', 'BOJ'],
      'RS': ['BEG']
    };

    const neighboringCountriesMap: { [key: string]: string[] } = {
      'PL': ['DE', 'CZ', 'SK', 'LT'],
      'DE': ['PL', 'CZ', 'AT', 'CH', 'FR', 'BE', 'NL', 'DK'],
      'FR': ['ES', 'IT', 'DE', 'CH', 'BE', 'GB'],
      'IT': ['FR', 'CH', 'AT', 'SI', 'ES'],
      'ES': ['FR', 'PT'],
      'GB': ['FR', 'IE', 'NL', 'BE'],
      'NL': ['DE', 'BE', 'GB'],
      'BE': ['FR', 'NL', 'DE', 'GB'],
      'CZ': ['DE', 'PL', 'AT', 'SK'],
      'SK': ['CZ', 'PL', 'AT'],
      'AT': ['DE', 'IT', 'CH', 'SI', 'CZ', 'SK'],
      'CH': ['DE', 'FR', 'IT', 'AT'],
      'TH': ['MY', 'SG', 'VN', 'ID'],
      'MY': ['TH', 'SG', 'ID'],
      'SG': ['MY', 'ID'],
      'VN': ['TH', 'CN'],
      'ID': ['MY', 'SG', 'TH'],
      'JP': ['KR', 'CN'],
      'KR': ['JP', 'CN'],
      'CN': ['JP', 'KR', 'VN'],
      'AE': ['SA', 'OM', 'QA'],
      'SA': ['AE', 'OM', 'QA', 'KW', 'BH'],
      'QA': ['SA', 'AE', 'BH'],
      'IN': ['PK', 'CN', 'NP', 'BD'],
      'AU': ['NZ'],
      'NZ': ['AU'],
      'US': ['CA', 'MX'],
      'CA': ['US']
    };

    const getAirportCodes = (code: string): string[] => {
      if (code.length === 3) return [code];
      if (airportMap[code]) return airportMap[code];
      return ['WAW'];
    };

    const getNeighboringAirports = (countryCode: string): string[] => {
      const neighbors = neighboringCountriesMap[countryCode] || [];
      const neighboringAirports: string[] = [];
      
      for (const neighbor of neighbors.slice(0, 3)) {
        const airports = airportMap[neighbor] || [];
        if (airports.length > 0) {
          neighboringAirports.push(airports[0]);
        }
      }
      
      return neighboringAirports;
    };

    // Get origin and destination airports
    const origin = searchParams.origins[0];
    const destination = searchParams.destinations[0];

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination are required'
      });
    }

    let originAirports = getAirportCodes(origin);
    let destinationAirports = getAirportCodes(destination);

    // Include neighboring countries if requested
    if (searchParams.includeNeighboringCountries) {
      console.log('🌍 Including neighboring countries in search');
      
      for (const originCountry of searchParams.origins) {
        if (originCountry.length === 2) {
          const neighboringAirports = getNeighboringAirports(originCountry);
          originAirports.push(...neighboringAirports);
          console.log(`📍 Origin ${originCountry}: Adding neighboring airports: [${neighboringAirports.join(', ')}]`);
        }
      }
      
      for (const destinationCountry of searchParams.destinations) {
        if (destinationCountry.length === 2) {
          const neighboringAirports = getNeighboringAirports(destinationCountry);
          destinationAirports.push(...neighboringAirports);
          console.log(`🎯 Destination ${destinationCountry}: Adding neighboring airports: [${neighboringAirports.join(', ')}]`);
        }
      }
    }

    // Remove duplicates and limit
    originAirports = [...new Set(originAirports)].slice(0, 3);
    destinationAirports = [...new Set(destinationAirports)].slice(0, 3);

    console.log(`🛫 Searching flights from [${originAirports.join(', ')}] to [${destinationAirports.join(', ')}]`);

    // Try to get real flight data from Aviationstack if API key is available
    let realFlightData: any[] = [];
    let dataSource = 'mock';
    let apiWarning: string | undefined;

    if (aviationstackApiKey) {
      console.log('🔑 API key found, attempting real flight search...');
      const searchPromises: Promise<any>[] = [];

      // Search for flights between airport combinations
      for (const originAirport of originAirports.slice(0, 2)) {
        for (const destAirport of destinationAirports.slice(0, 2)) {
          const searchPromise = searchAviationstackFlights(aviationstackApiKey, originAirport, destAirport, searchParams.dateRange.from);
          searchPromises.push(searchPromise);
        }
      }

      try {
        const results = await Promise.allSettled(searchPromises);
        
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.data) {
            realFlightData.push(...result.value.data);
          }
        }

        if (realFlightData.length > 0) {
          dataSource = 'aviationstack';
          console.log(`✅ Found ${realFlightData.length} real flights from Aviationstack`);
        } else {
          console.log('⚠️ No real flight data available, using mock data');
          apiWarning = 'No real flight data available for selected route and date';
        }
      } catch (error) {
        console.error('❌ Error fetching from Aviationstack:', error);
        apiWarning = 'Aviationstack API error, using mock data';
      }
    } else {
      console.log('🎭 No API key configured, using mock data');
      apiWarning = 'API key not configured, using simulated flight data';
    }

    // Convert Aviationstack data to Amadeus-like format for compatibility
    const convertedFlights = realFlightData.length > 0 
      ? convertAviationstackToAmadeusFormat(realFlightData)
      : [];

    // If we have real data, use it; otherwise fall back to mock data
    const flights = convertedFlights.length > 0 ? convertedFlights : generateMockFlights(searchParams);
    
    // Log search to database
    try {
      await db.insert(flightSearches).values({
        origins: JSON.stringify(searchParams.origins),
        destinations: JSON.stringify(searchParams.destinations),
        departureDate: searchParams.dateRange.from,
        returnDate: searchParams.dateRange.to || null,
        departureFlex: searchParams.departureFlex,
        returnFlex: searchParams.returnFlex,
        autoRecommendStopovers: searchParams.autoRecommendStopovers,
        includeNeighboringCountries: searchParams.includeNeighboringCountries,
        resultCount: flights.length
      });
    } catch (dbError) {
      console.error('Database logging failed:', dbError);
      // Continue without failing the search
    }

    const responseData = {
      success: true,
      data: flights,
      meta: {
        count: flights.length,
        searchParams,
        dataSource,
        searchedRoutes: originAirports.map(o => destinationAirports.map(d => `${o}->${d}`)).flat(),
        warning: apiWarning
      },
      dictionaries: {
        carriers: {
          'QR': 'Qatar Airways',
          'TK': 'Turkish Airlines', 
          'EK': 'Emirates',
          'LH': 'Lufthansa',
          'AF': 'Air France',
          'KL': 'KLM',
          'LO': 'LOT Polish Airlines'
        },
        aircraft: {
          '359': 'Airbus A350-900',
          '77W': 'Boeing 777-300ER',
          '73J': 'Boeing 737-900',
          'A38': 'Airbus A380-800'
        }
      }
    };

    return res.json(responseData);

  } catch (error) {
    console.error('❌ Flight search error:', error);
    
    // Return mock data as fallback on error
    const mockFlights = generateMockFlights(req.body);
    
    return res.json({
      success: true,
      data: mockFlights,
      meta: {
        count: mockFlights.length,
        searchParams: req.body,
        dataSource: 'mock',
        error: 'API error occurred, using mock data',
        warning: 'Real flight data unavailable due to API error'
      },
      dictionaries: {
        carriers: {
          'QR': 'Qatar Airways',
          'TK': 'Turkish Airlines',
          'EK': 'Emirates'
        }
      }
    });
  }
});

// Function to search flights using Aviationstack API
async function searchAviationstackFlights(apiKey: string, origin: string, destination: string, date: string) {
  const url = new URL('http://api.aviationstack.com/v1/flights');
  
  // Add timeout and configure request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    url.searchParams.set('access_key', apiKey);
    url.searchParams.set('dep_iata', origin);
    url.searchParams.set('arr_iata', destination);
    url.searchParams.set('flight_date', date);
    url.searchParams.set('limit', '50');
    
    console.log(`🔍 Searching Aviationstack: ${origin} -> ${destination} on ${date}`);
    
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FlightAI-Search/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Aviationstack API error: ${response.status}`);
    }
    
    const data: AviationstackResponse = await response.json();
    
    console.log(`✅ Aviationstack returned ${data.data?.length || 0} flights for ${origin}->${destination}`);
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`❌ Aviationstack search failed for ${origin}->${destination}:`, error);
    return { data: [] };
  }
}

// Function to convert Aviationstack format to Amadeus-like format for compatibility
function convertAviationstackToAmadeusFormat(aviationstackFlights: AviationstackFlight[]) {
  return aviationstackFlights.map((flight, index) => {
    // Calculate estimated price based on route and airline
    const estimatedPrice = calculateEstimatedPrice(flight);
    
    // Calculate duration
    const departureTime = new Date(flight.departure.scheduled);
    const arrivalTime = new Date(flight.arrival.scheduled);
    const durationMs = arrivalTime.getTime() - departureTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `PT${hours}H${minutes}M`;
    
    return {
      id: `aviationstack-${flight.flight.iata}-${index}`,
      price: {
        total: estimatedPrice.toString(),
        currency: 'PLN'
      },
      itineraries: [{
        duration,
        segments: [{
          departure: {
            iataCode: flight.departure.iata,
            at: flight.departure.scheduled,
            terminal: flight.departure.terminal
          },
          arrival: {
            iataCode: flight.arrival.iata, 
            at: flight.arrival.scheduled,
            terminal: flight.arrival.terminal
          },
          carrierCode: flight.airline.iata,
          number: flight.flight.number,
          aircraft: {
            code: '73G' // Generic aircraft code since Aviationstack doesn't always provide this
          },
          duration
        }]
      }],
      travelerPricings: [{
        fareOption: 'STANDARD',
        travelerType: 'ADULT',
        price: {
          total: estimatedPrice.toString(),
          currency: 'PLN'
        }
      }],
      source: 'aviationstack',
      originalData: flight
    };
  });
}

// Function to calculate estimated price based on route and airline
function calculateEstimatedPrice(flight: AviationstackFlight): number {
  // Base price calculation logic
  let basePrice = 1500; // Base price in PLN
  
  // Adjust based on airline (premium vs budget)
  const premiumAirlines = ['QR', 'EK', 'LH', 'AF', 'TK', 'SQ'];
  const budgetAirlines = ['FR', 'W6', 'U2', 'EW'];
  
  if (premiumAirlines.includes(flight.airline.iata)) {
    basePrice *= 1.4; // Premium multiplier
  } else if (budgetAirlines.includes(flight.airline.iata)) {
    basePrice *= 0.7; // Budget multiplier
  }
  
  // Adjust based on route distance (rough estimation)
  const longHaulRoutes = ['DXB', 'DOH', 'BKK', 'SIN', 'NRT', 'ICN', 'LAX', 'JFK'];
  const departure = flight.departure.iata;
  const arrival = flight.arrival.iata;
  
  if (longHaulRoutes.includes(departure) || longHaulRoutes.includes(arrival)) {
    basePrice *= 1.3; // Long haul multiplier
  }
  
  // Add some randomness for variety
  const variation = 0.8 + Math.random() * 0.4; // ±20% variation
  basePrice *= variation;
  
  return Math.round(basePrice);
}

export default router;