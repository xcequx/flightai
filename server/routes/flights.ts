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

// Hub definitions for multi-leg routing
interface Hub {
  iata: string;
  name: string;
  country: string;
  city: string;
  minLayoverDays: number;
  maxLayoverDays: number;
  carriers: string[];
  attractions: string[];
  description: string;
  averageDailyCost: number; // USD per day
}

const MAJOR_HUBS: Hub[] = [
  {
    iata: 'DXB',
    name: 'Dubai International Airport',
    country: 'UAE',
    city: 'Dubai',
    minLayoverDays: 2,
    maxLayoverDays: 3,
    carriers: ['EK', '6E', 'AI', 'UK'],
    attractions: ['Burj Khalifa', 'Dubai Mall', 'Gold Souk', 'Desert Safari', 'Palm Jumeirah'],
    description: 'Luxury shopping paradise with stunning architecture and desert adventures',
    averageDailyCost: 150
  },
  {
    iata: 'BOM',
    name: 'Mumbai International Airport',
    country: 'IN',
    city: 'Mumbai',
    minLayoverDays: 2,
    maxLayoverDays: 4,
    carriers: ['AI', '6E', 'SG', 'UK'],
    attractions: ['Gateway of India', 'Marine Drive', 'Bollywood Studios', 'Street Food Tours', 'Elephanta Caves'],
    description: 'Bollywood capital with incredible street food and vibrant culture',
    averageDailyCost: 50
  },
  {
    iata: 'DEL',
    name: 'Delhi International Airport',
    country: 'IN',
    city: 'New Delhi',
    minLayoverDays: 2,
    maxLayoverDays: 4,
    carriers: ['AI', '6E', 'SG', 'UK'],
    attractions: ['Red Fort', 'India Gate', 'Taj Mahal (nearby)', 'Humayun\'s Tomb', 'Spice Markets'],
    description: 'Historical capital with magnificent monuments and rich heritage',
    averageDailyCost: 45
  },
  {
    iata: 'SIN',
    name: 'Singapore Changi Airport',
    country: 'SG',
    city: 'Singapore',
    minLayoverDays: 2,
    maxLayoverDays: 4,
    carriers: ['SQ', '3K', 'TR'],
    attractions: ['Gardens by the Bay', 'Marina Bay Sands', 'Hawker Centers', 'Sentosa Island', 'Chinatown'],
    description: 'Modern city-state with incredible food and futuristic attractions',
    averageDailyCost: 120
  },
  {
    iata: 'DOH',
    name: 'Hamad International Airport',
    country: 'QA',
    city: 'Doha',
    minLayoverDays: 2,
    maxLayoverDays: 3,
    carriers: ['QR'],
    attractions: ['Museum of Islamic Art', 'Souq Waqif', 'The Pearl', 'Desert Tours', 'Corniche Waterfront'],
    description: 'Arabian Gulf gem with luxury shopping and cultural experiences',
    averageDailyCost: 130
  },
  {
    iata: 'IST',
    name: 'Istanbul Airport',
    country: 'TR',
    city: 'Istanbul',
    minLayoverDays: 2,
    maxLayoverDays: 4,
    carriers: ['TK', 'PC'],
    attractions: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar', 'Bosphorus Cruise', 'Turkish Baths'],
    description: 'Bridge between Europe and Asia with incredible history and cuisine',
    averageDailyCost: 70
  }
];

// Simple hash function for deterministic seeding
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Generate normalized itinerary signature for deduplication
const getItinerarySignature = (origin: string, hub: string, destination: string, layoverDays: number): string => {
  return `${origin}-${hub}-${destination}-${layoverDays}`;
};

// Generate intelligent multi-leg routes
const generateMultiLegRoutes = (searchParams: FlightSearchParams, originAirports: string[], destinationAirports: string[], searchId?: string): any[] => {
  const baseDate = new Date(searchParams.dateRange.from);
  
  console.log(`🔄 Generating multi-leg routes from [${originAirports.join(', ')}] to [${destinationAirports.join(', ')}]`);
  
  const multiLegFlights: any[] = [];
  const seenSignatures = new Set<string>();
  
  // Create deterministic random generator seeded by searchId
  const seed = searchId ? simpleHash(searchId) : Date.now();
  let seedCounter = seed;
  const seededRandom = () => {
    seedCounter = (seedCounter * 9301 + 49297) % 233280;
    return seedCounter / 233280;
  };
  
  // Iterate through ALL origin->destination combinations
  for (const origin of originAirports) {
    for (const destination of destinationAirports) {
      // Determine if this is a long-haul route that benefits from multi-leg
      const isLongHaul = isLongHaulRoute(origin, destination);
      
      if (!isLongHaul) {
        console.log(`❌ ${origin}->${destination}: Not a long-haul route, skipping`);
        continue;
      }
      
      // For each major hub, create a multi-leg route
      MAJOR_HUBS.forEach((hub, index) => {
        // Check if this hub makes sense for the route
        if (!isValidHubForRoute(origin, destination, hub.iata)) {
          return;
        }
        
        // Deterministic layover days selection (2-3 days max)
        const layoverDays = Math.floor(seededRandom() * 2) + 2; // 2-3 days only
        
        // Generate normalized signature for deduplication
        const signature = getItinerarySignature(origin, hub.iata, destination, layoverDays);
        if (seenSignatures.has(signature)) {
          console.log(`⚠️ Duplicate route signature detected: ${signature}, skipping`);
          return;
        }
        seenSignatures.add(signature);
    
    // First leg: Origin -> Hub
    const firstLegDate = new Date(baseDate);
    const firstLegArrival = new Date(firstLegDate.getTime() + getFlightDuration(origin, hub.iata) * 60 * 60 * 1000);
    
    // Second leg: Hub -> Destination (after layover)
    const secondLegDate = new Date(firstLegArrival.getTime() + layoverDays * 24 * 60 * 60 * 1000);
    const secondLegArrival = new Date(secondLegDate.getTime() + getFlightDuration(hub.iata, destination) * 60 * 60 * 1000);
    
    // Calculate total duration and price
    const totalDurationMs = secondLegArrival.getTime() - firstLegDate.getTime();
    const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Price calculation with savings logic
    const directPrice = calculateDirectFlightPrice(origin, destination);
    const multiLegPrice = calculateMultiLegPrice(origin, hub.iata, destination, layoverDays);
    const savings = directPrice - multiLegPrice;
    const savingsPercent = Math.round((savings / directPrice) * 100);
    
    // Only include if it's cheaper or max 15% more expensive
    if (multiLegPrice <= directPrice * 1.15) {
      const carrier1 = hub.carriers[Math.floor(Math.random() * hub.carriers.length)];
      const carrier2 = hub.carriers[Math.floor(Math.random() * hub.carriers.length)];
      
        multiLegFlights.push({
          id: `multi-${origin.toLowerCase()}-${hub.iata.toLowerCase()}-${destination.toLowerCase()}-${index}`,
          signature,
          price: { total: multiLegPrice.toString(), currency: "PLN" },
        itineraries: [{
          duration: `PT${totalHours}H${totalMinutes}M`,
          segments: [
            {
              departure: {
                iataCode: origin.length === 3 ? origin : 'WAW',
                at: firstLegDate.toISOString()
              },
              arrival: {
                iataCode: hub.iata,
                at: firstLegArrival.toISOString()
              },
              carrierCode: carrier1,
              number: generateFlightNumber(carrier1),
              aircraft: { code: getRandomAircraft() },
              duration: `PT${getFlightDuration(origin, hub.iata)}H00M`
            },
            {
              departure: {
                iataCode: hub.iata,
                at: secondLegDate.toISOString()
              },
              arrival: {
                iataCode: destination.length === 3 ? destination : 'BKK',
                at: secondLegArrival.toISOString()
              },
              carrierCode: carrier2,
              number: generateFlightNumber(carrier2),
              aircraft: { code: getRandomAircraft() },
              duration: `PT${getFlightDuration(hub.iata, destination)}H00M`
            }
          ]
        }],
        travelerPricings: [{
          fareOption: "STANDARD",
          travelerType: "ADULT",
          price: { total: multiLegPrice.toString(), currency: "PLN" }
        }],
        multiLeg: true,
        stopoverInfo: {
          hub: hub,
          layoverDays,
          savings,
          savingsPercent,
          directPrice,
          totalCostWithStay: multiLegPrice + (layoverDays * hub.averageDailyCost * 4.2) // Convert USD to PLN roughly
        }
      });
      
          console.log(`✅ Added multi-leg route ${origin}->${hub.city}->${destination}: ${savings > 0 ? savings : Math.abs(savings)} PLN ${savings > 0 ? 'cheaper' : 'more expensive'}`);
        }
      });
    }
  }
  
  // FIXED: Remove internal sorting - let global price sort handle all flights
  console.log(`🔄 Generated ${multiLegFlights.length} multi-leg routes - will sort globally by price`);
  return multiLegFlights;
};

// Helper functions for multi-leg routing
const isLongHaulRoute = (origin: string, destination: string): boolean => {
  // FIXED: Added missing Thai destinations CNX, HKT, HDY, USM, UTP for comprehensive coverage
  const longHaulDestinations = ['BKK', 'DMK', 'CNX', 'HKT', 'HDY', 'USM', 'UTP', 'SIN', 'NRT', 'HND', 'ICN', 'SYD', 'MEL', 'LAX', 'JFK'];
  // Expanded origins to include more European airports and neighboring airports
  const longHaulOrigins = ['WAW', 'KRK', 'GDN', 'FRA', 'MUC', 'LHR', 'CDG', 'PRG', 'VIE', 'BUD', 'BER', 'DUS', 'AMS', 'BTS', 'SZG', 'VNO', 'KUN'];
  
  const dest = destination.length === 3 ? destination : 'BKK';
  const orig = origin.length === 3 ? origin : 'WAW';
  
  const isLongHaul = longHaulOrigins.includes(orig) && longHaulDestinations.includes(dest);
  console.log(`🔍 Long-haul check ${orig}->${dest}: ${isLongHaul ? '✅ Valid' : '❌ Not long-haul'}`);
  return isLongHaul;
};

const isValidHubForRoute = (origin: string, destination: string, hub: string): boolean => {
  // Logic to determine if a hub makes geographical sense for a route
  const routePatterns = {
    'europe-asia': ['DXB', 'DOH', 'IST', 'BOM', 'DEL'],
    'europe-se-asia': ['DXB', 'DOH', 'SIN', 'BOM', 'DEL'],
    'europe-thailand': ['DXB', 'DOH', 'BOM', 'DEL', 'SIN']
  };
  
  const orig = origin.length === 3 ? origin : 'WAW';
  const dest = destination.length === 3 ? destination : 'BKK';
  
  // FIXED: Extended to include ALL TH destinations broadly (CNX, HKT, HDY, USM, UTP)
  if ((orig.match(/WAW|KRK|GDN|FRA|MUC|LHR|CDG|PRG|VIE|BUD|BER|DUS|AMS|BTS|SZG|VNO|KUN/) && dest.match(/BKK|DMK|CNX|HKT|HDY|USM|UTP|SIN|NRT|HND/))) {
    const isValid = ['DXB', 'DOH', 'IST', 'BOM', 'DEL', 'SIN'].includes(hub);
    console.log(`🔍 Hub validation ${orig}->${dest} via ${hub}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    return isValid;
  }
  
  return true;
};

const getFlightDuration = (from: string, to: string): number => {
  // Rough flight durations in hours - EXPANDED for new Thai destinations
  const durations: { [key: string]: number } = {
    'WAW-DXB': 7, 'DXB-BKK': 6, 'DXB-CNX': 7, 'DXB-HKT': 7, 'DXB-HDY': 8, 'DXB-USM': 7, 'DXB-UTP': 8,
    'WAW-BOM': 8, 'BOM-BKK': 4, 'BOM-CNX': 5, 'BOM-HKT': 5, 'BOM-HDY': 6, 'BOM-USM': 5, 'BOM-UTP': 6,
    'WAW-DEL': 8, 'DEL-BKK': 4, 'DEL-CNX': 5, 'DEL-HKT': 5, 'DEL-HDY': 6, 'DEL-USM': 5, 'DEL-UTP': 6,
    'WAW-SIN': 13, 'SIN-BKK': 2, 'SIN-CNX': 3, 'SIN-HKT': 3, 'SIN-HDY': 4, 'SIN-USM': 3, 'SIN-UTP': 4,
    'WAW-DOH': 6, 'DOH-BKK': 7, 'DOH-CNX': 8, 'DOH-HKT': 8, 'DOH-HDY': 9, 'DOH-USM': 8, 'DOH-UTP': 9,
    'WAW-IST': 4, 'IST-BKK': 10, 'IST-CNX': 11, 'IST-HKT': 11, 'IST-HDY': 12, 'IST-USM': 11, 'IST-UTP': 12,
    // Direct routes from Europe to Thailand
    'WAW-BKK': 12, 'WAW-CNX': 14, 'WAW-HKT': 15, 'WAW-HDY': 16, 'WAW-USM': 15, 'WAW-UTP': 16,
    'GDN-BKK': 13, 'GDN-CNX': 15, 'GDN-HKT': 16, 'GDN-HDY': 17, 'GDN-USM': 16, 'GDN-UTP': 17,
    'KRK-BKK': 13, 'KRK-CNX': 15, 'KRK-HKT': 16, 'KRK-HDY': 17, 'KRK-USM': 16, 'KRK-UTP': 17
  };
  
  const key = `${from}-${to}`;
  const reverseKey = `${to}-${from}`;
  
  return durations[key] || durations[reverseKey] || 8;
};

const calculateDirectFlightPrice = (origin: string, destination: string): number => {
  // Base prices for direct flights (in PLN) - EXPANDED for new Thai destinations
  const basePrices: { [key: string]: number } = {
    'WAW-BKK': 3200, 'WAW-CNX': 3400, 'WAW-HKT': 3600, 'WAW-HDY': 3800, 'WAW-USM': 3700, 'WAW-UTP': 3900,
    'KRK-BKK': 3400, 'KRK-CNX': 3600, 'KRK-HKT': 3800, 'KRK-HDY': 4000, 'KRK-USM': 3900, 'KRK-UTP': 4100,
    'GDN-BKK': 3300, 'GDN-CNX': 3500, 'GDN-HKT': 3700, 'GDN-HDY': 3900, 'GDN-USM': 3800, 'GDN-UTP': 4000,
    'WAW-SIN': 3800,
    'WAW-NRT': 4200
  };
  
  const key = `${origin}-${destination}`;
  return basePrices[key] || 3200;
};

const calculateMultiLegPrice = (origin: string, hub: string, destination: string, layoverDays: number): number => {
  // EXPANDED for new Thai destinations
  const legPrices: { [key: string]: number } = {
    // From Europe to hubs
    'WAW-DXB': 1200, 'WAW-BOM': 1100, 'WAW-DEL': 1100, 'WAW-SIN': 2200, 'WAW-DOH': 1300, 'WAW-IST': 800,
    'GDN-DXB': 1250, 'GDN-BOM': 1150, 'GDN-DEL': 1150, 'GDN-SIN': 2250, 'GDN-DOH': 1350, 'GDN-IST': 850,
    'KRK-DXB': 1200, 'KRK-BOM': 1100, 'KRK-DEL': 1100, 'KRK-SIN': 2200, 'KRK-DOH': 1300, 'KRK-IST': 800,
    
    // From hubs to ALL Thai destinations
    'DXB-BKK': 900, 'DXB-CNX': 950, 'DXB-HKT': 1000, 'DXB-HDY': 1050, 'DXB-USM': 1000, 'DXB-UTP': 1100,
    'BOM-BKK': 600, 'BOM-CNX': 650, 'BOM-HKT': 700, 'BOM-HDY': 750, 'BOM-USM': 700, 'BOM-UTP': 800,
    'DEL-BKK': 650, 'DEL-CNX': 700, 'DEL-HKT': 750, 'DEL-HDY': 800, 'DEL-USM': 750, 'DEL-UTP': 850,
    'SIN-BKK': 300, 'SIN-CNX': 350, 'SIN-HKT': 400, 'SIN-HDY': 450, 'SIN-USM': 400, 'SIN-UTP': 500,
    'DOH-BKK': 1000, 'DOH-CNX': 1050, 'DOH-HKT': 1100, 'DOH-HDY': 1150, 'DOH-USM': 1100, 'DOH-UTP': 1200,
    'IST-BKK': 1200, 'IST-CNX': 1250, 'IST-HKT': 1300, 'IST-HDY': 1350, 'IST-USM': 1300, 'IST-UTP': 1400
  };
  
  const leg1 = legPrices[`${origin}-${hub}`] || 1000;
  const leg2 = legPrices[`${hub}-${destination}`] || 800;
  
  // Add slight discount for booking separate legs (but add complexity cost)
  const basePrice = leg1 + leg2;
  const layoverDiscount = layoverDays > 2 ? 0.95 : 1.0; // Small discount for longer layovers
  
  return Math.round(basePrice * layoverDiscount);
};

const generateFlightNumber = (carrierCode: string): string => {
  const number = Math.floor(Math.random() * 9000) + 1000;
  return number.toString();
};

const getRandomAircraft = (): string => {
  const aircraft = ['77W', '359', 'A38', '73J', '32A', '320'];
  return aircraft[Math.floor(Math.random() * aircraft.length)];
};

// Enhanced mock data generator
const generateMockFlights = (searchParams: FlightSearchParams, originAirports: string[] = [], destinationAirports: string[] = [], searchId?: string) => {
  const origin = searchParams.origins[0] || 'WAW';
  const destination = searchParams.destinations[0] || 'BKK';
  
  // Start with traditional direct/1-stop flights
  const traditionalFlights = [
    {
      id: "direct-1",
      price: { total: "3200", currency: "PLN" },
      itineraries: [{
        duration: "PT12H30M",
        segments: [{
          departure: { iataCode: origin.length === 3 ? origin : 'WAW', at: `${searchParams.dateRange.from}T10:30:00` },
          arrival: { iataCode: destination.length === 3 ? destination : 'BKK', at: `${searchParams.dateRange.from}T23:00:00` },
          carrierCode: 'TG',
          number: '917',
          aircraft: { code: '77W' },
          duration: "PT12H30M"
        }]
      }],
      travelerPricings: [{
        fareOption: "STANDARD",
        travelerType: "ADULT",
        price: { total: "3200", currency: "PLN" }
      }],
      directFlight: true
    },
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
    }
  ];

  // Add multi-leg routes if autoRecommendStopovers is enabled
  if (searchParams.autoRecommendStopovers && originAirports.length > 0 && destinationAirports.length > 0) {
    const multiLegRoutes = generateMultiLegRoutes(searchParams, originAirports, destinationAirports, searchId);
    console.log(`🔀 Generated ${multiLegRoutes.length} multi-leg routes`);
    return [...traditionalFlights, ...multiLegRoutes];
  }

  return traditionalFlights;
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
      'RS': ['BEG'],
      'LT': ['VNO', 'KUN']
    };

    const neighboringCountriesMap: { [key: string]: string[] } = {
      'PL': ['DE', 'CZ', 'SK', 'LT', 'AT', 'HU'],
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
      
      for (const neighbor of neighbors.slice(0, 5)) { // Allow more neighbors
        const airports = airportMap[neighbor] || [];
        if (airports.length > 0) {
          // Take top 2-3 airports per neighbor instead of just first
          const topAirports = airports.slice(0, Math.min(3, airports.length));
          neighboringAirports.push(...topAirports);
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

    // Generate searchId for deterministic multi-leg routing
    const searchId = `${originAirports.join('-')}-${destinationAirports.join('-')}-${searchParams.dateRange.from}`;
    
    // If we have real data, use it; otherwise fall back to mock data
    const flights = convertedFlights.length > 0 ? convertedFlights : generateMockFlights(searchParams, originAirports, destinationAirports, searchId);
    
    // ALWAYS generate multi-leg routes if autoRecommendStopovers is enabled, regardless of real/mock data
    let allFlights = flights;
    if (searchParams.autoRecommendStopovers && originAirports.length > 0 && destinationAirports.length > 0) {
      const multiLegRoutes = generateMultiLegRoutes(searchParams, originAirports, destinationAirports, searchId);
      console.log(`🔄 Adding ${multiLegRoutes.length} multi-leg routes to ${dataSource} flight data`);
      allFlights = [...flights, ...multiLegRoutes];
    }
    
    // CRITICAL: Global cheapest-first ordering by Number(price.total) ascending
    allFlights.sort((a, b) => {
      const priceA = Number(a.price?.total || 9999);
      const priceB = Number(b.price?.total || 9999);
      
      // Primary sort: by absolute price ascending (cheapest first)
      if (priceA !== priceB) {
        return priceA - priceB;
      }
      
      // Secondary tie-breaker: by value (prefer multi-leg with savings)
      const valueA = a.stopoverInfo?.savings || 0;
      const valueB = b.stopoverInfo?.savings || 0;
      return valueB - valueA; // Higher savings first
    });
    
    // Log first 3 prices for verification
    const topPrices = allFlights.slice(0, 3).map(f => `${f.price?.total} ${f.price?.currency}${f.multiLeg ? ' (multi-leg)' : ''}`);
    console.log(`💰 GLOBAL SORT COMPLETE: ${allFlights.length} flights sorted by price - cheapest first: [${topPrices.join(', ')}]`);
    
    // Add test logs for specific routes
    const cnxFlights = allFlights.filter(f => f.itineraries?.[0]?.segments?.some(s => s.arrival.iataCode === 'CNX' || s.departure.iataCode === 'CNX'));
    if (cnxFlights.length > 0) {
      console.log(`✅ CNX routes generated: ${cnxFlights.length} flights to/from Chiang Mai`);
    }
    
    const gdnBkkFlights = allFlights.filter(f => {
      const segments = f.itineraries?.[0]?.segments || [];
      const hasGdn = segments.some(s => s.departure.iataCode === 'GDN');
      const hasBkk = segments.some(s => s.arrival.iataCode === 'BKK');
      return hasGdn && hasBkk;
    });
    if (gdnBkkFlights.length > 0) {
      console.log(`✅ GDN->BKK routes generated: ${gdnBkkFlights.length} flights`);
    }
    
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
        resultCount: allFlights.length
      });
    } catch (dbError) {
      console.error('Database logging failed:', dbError);
      // Continue without failing the search
    }

    // Count multi-leg flights for meta
    const multiLegFlights = allFlights.filter(f => f.multiLeg);
    
    const responseData = {
      success: true,
      data: allFlights,
      meta: {
        count: allFlights.length,
        multiLegCount: multiLegFlights.length,
        searchId,
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
    
    // Generate simple fallback airports and searchId for error case
    const fallbackOriginAirports = req.body.origins?.map((o: string) => o.length === 3 ? o : 'WAW').filter(Boolean) || ['WAW'];
    const fallbackDestinationAirports = req.body.destinations?.map((d: string) => d.length === 3 ? d : 'BKK').filter(Boolean) || ['BKK'];
    const fallbackSearchId = `fallback-${Date.now()}`;
    
    // Return mock data as fallback on error
    const mockFlights = generateMockFlights(req.body, fallbackOriginAirports, fallbackDestinationAirports, fallbackSearchId);
    
    return res.json({
      success: true,
      data: mockFlights,
      meta: {
        count: mockFlights.length,
        multiLegCount: mockFlights.filter(f => f.multiLeg).length,
        searchId: fallbackSearchId,
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
  
  // Adjust based on route distance (rough estimation) - EXPANDED for new Thai destinations
  const longHaulRoutes = ['DXB', 'DOH', 'BKK', 'CNX', 'HKT', 'HDY', 'USM', 'UTP', 'SIN', 'NRT', 'ICN', 'LAX', 'JFK'];
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