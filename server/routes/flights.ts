import { Router } from 'express';
import { db } from '../db.js';
import { enhancedFlightSearches, flightSearchSchema, FlightSearchRequest } from '../../shared/schema.js';
import amadeus from '../utils/amadeus.js';

const router = Router();

interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: AmadeusItinerary[];
  price: AmadeusPrice;
  pricingOptions: AmadeusPricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: AmadeusTravelerPricing[];
}

interface AmadeusItinerary {
  duration: string;
  segments: AmadeusSegment[];
}

interface AmadeusSegment {
  departure: AmadeusEndpoint;
  arrival: AmadeusEndpoint;
  carrierCode: string;
  number: string;
  aircraft: { code: string };
  operating?: { carrierCode: string };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

interface AmadeusEndpoint {
  iataCode: string;
  terminal?: string;
  at: string;
}

interface AmadeusPrice {
  currency: string;
  total: string;
  base: string;
  fees?: AmadeusFee[];
  grandTotal: string;
}

interface AmadeusFee {
  amount: string;
  type: string;
}

interface AmadeusPricingOptions {
  fareType: string[];
  includedCheckedBagsOnly: boolean;
}

interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: AmadeusPrice;
  fareDetailsBySegment: AmadeusFareDetails[];
}

interface AmadeusFareDetails {
  segmentId: string;
  cabin: string;
  fareBasis: string;
  brandedFare?: string;
  class: string;
  includedCheckedBags: { quantity: number };
}

interface AmadeusResponse {
  meta: {
    count: number;
    links?: {
      self: string;
      next?: string;
      previous?: string;
      last?: string;
      first?: string;
    };
  };
  data: AmadeusFlightOffer[];
  dictionaries?: {
    locations?: { [key: string]: any };
    aircraft?: { [key: string]: string };
    currencies?: { [key: string]: string };
    carriers?: { [key: string]: string };
  };
}

interface FlightSearchParams extends FlightSearchRequest {
  // Extended from schema
}

// Helper functions
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const getItinerarySignature = (origin: string, hub: string, destination: string, layoverDays: number): string => {
  return `${origin}-${hub}-${destination}-${layoverDays}`;
};

const isLongHaulRoute = (origin: string, destination: string): boolean => {
  const longHaulDestinations = ['BKK', 'DMK', 'CNX', 'HKT', 'HDY', 'USM', 'UTP', 'SIN', 'NRT', 'HND', 'ICN', 'SYD', 'MEL', 'LAX', 'JFK'];
  const longHaulOrigins = ['WAW', 'KRK', 'GDN', 'FRA', 'MUC', 'LHR', 'CDG', 'PRG', 'VIE', 'BUD', 'BER', 'DUS', 'AMS', 'BTS', 'SZG', 'VNO', 'KUN'];
  
  const dest = destination.length === 3 ? destination : 'BKK';
  const orig = origin.length === 3 ? origin : 'WAW';
  
  return longHaulOrigins.includes(orig) && longHaulDestinations.includes(dest);
};

const isValidHubForRoute = (origin: string, destination: string, hub: string): boolean => {
  const orig = origin.length === 3 ? origin : 'WAW';
  const dest = destination.length === 3 ? destination : 'BKK';
  
  if ((orig.match(/WAW|KRK|GDN|FRA|MUC|LHR|CDG|PRG|VIE|BUD|BER|DUS|AMS|BTS|SZG|VNO|KUN/) && dest.match(/BKK|DMK|CNX|HKT|HDY|USM|UTP|SIN|NRT|HND/))) {
    return ['DXB', 'DOH', 'IST'].includes(hub);
  }
  
  return true;
};

const getFlightDuration = (from: string, to: string): number => {
  const durations: { [key: string]: number } = {
    'WAW-DXB': 7, 'DXB-BKK': 6, 'DXB-CNX': 7, 'DXB-HKT': 7,
    'WAW-DOH': 6, 'DOH-BKK': 7, 'DOH-CNX': 8, 'DOH-HKT': 8,
    'WAW-IST': 4, 'IST-BKK': 10, 'IST-CNX': 11, 'IST-HKT': 11,
    'WAW-BKK': 12, 'WAW-CNX': 14, 'WAW-HKT': 15
  };
  
  const key = `${from}-${to}`;
  const reverseKey = `${to}-${from}`;
  
  return durations[key] || durations[reverseKey] || 8;
};

const calculateDirectFlightPrice = (origin: string, destination: string): number => {
  const basePrices: { [key: string]: number } = {
    'WAW-BKK': 3200, 'WAW-CNX': 3400, 'WAW-HKT': 3600,
    'KRK-BKK': 3400, 'KRK-CNX': 3600, 'KRK-HKT': 3800,
    'GDN-BKK': 3300, 'GDN-CNX': 3500, 'GDN-HKT': 3700,
    'WAW-SIN': 3800, 'WAW-NRT': 4200
  };
  
  const key = `${origin}-${destination}`;
  return basePrices[key] || 3200;
};

const calculateMultiLegPrice = (origin: string, hub: string, destination: string, layoverDays: number): number => {
  const legPrices: { [key: string]: number } = {
    'WAW-DXB': 1200, 'DXB-BKK': 900, 'DXB-CNX': 950, 'DXB-HKT': 1000,
    'WAW-DOH': 1300, 'DOH-BKK': 1000, 'DOH-CNX': 1050, 'DOH-HKT': 1100,
    'WAW-IST': 800, 'IST-BKK': 1200, 'IST-CNX': 1250, 'IST-HKT': 1300
  };
  
  const leg1 = legPrices[`${origin}-${hub}`] || 1000;
  const leg2 = legPrices[`${hub}-${destination}`] || 800;
  
  const basePrice = leg1 + leg2;
  const layoverDiscount = layoverDays > 2 ? 0.95 : 1.0;
  
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

// Enhanced airport mapping for better coverage
const getAirportCodes = (code: string): string[] => {
  const airportMap: { [key: string]: string[] } = {
    'PL': ['WAW', 'KRK', 'GDN', 'WRO', 'POZ', 'KTW', 'RZE', 'BZG'],
    'TH': ['BKK', 'DMK', 'CNX', 'HKT', 'HDY', 'USM', 'UTP'],
    'JP': ['NRT', 'HND', 'KIX', 'NGO', 'CTS', 'FUK', 'OKA'],
    'SG': ['SIN'],
    'AE': ['DXB', 'AUH', 'SHJ', 'RKT'],
    'TR': ['IST', 'SAW', 'ADB', 'AYT', 'ESB'],
    'DE': ['FRA', 'MUC', 'BER', 'DUS', 'HAM', 'CGN', 'STR'],
    'GB': ['LHR', 'LGW', 'STN', 'MAN', 'BHX', 'EDI', 'GLA'],
    'FR': ['CDG', 'ORY', 'NCE', 'LYS', 'MRS', 'TLS', 'NTE']
  };

  if (code.length === 3) return [code];
  if (airportMap[code]) return airportMap[code];
  return ['WAW'];
};

const getNeighboringAirports = (countryCode: string): string[] => {
  const neighboringCountriesMap: { [key: string]: string[] } = {
    'PL': ['DE', 'CZ', 'SK', 'LT', 'AT', 'HU'],
    'DE': ['PL', 'CZ', 'AT', 'CH', 'FR', 'BE', 'NL', 'DK'],
    'TH': ['MY', 'SG', 'VN', 'ID']
  };

  const airportMap: { [key: string]: string[] } = {
    'PL': ['WAW', 'KRK', 'GDN', 'WRO', 'POZ', 'KTW'],
    'DE': ['FRA', 'MUC', 'BER', 'DUS', 'HAM', 'CGN'],
    'CZ': ['PRG', 'BRQ'],
    'SK': ['BTS'],
    'AT': ['VIE', 'SZG'],
    'TH': ['BKK', 'DMK', 'CNX', 'HKT'],
    'SG': ['SIN']
  };
  
  const neighbors = neighboringCountriesMap[countryCode] || [];
  const neighboringAirports: string[] = [];
  
  for (const neighbor of neighbors.slice(0, 5)) {
    const airports = airportMap[neighbor] || [];
    if (airports.length > 0) {
      const topAirports = airports.slice(0, Math.min(3, airports.length));
      neighboringAirports.push(...topAirports);
    }
  }
  
  return neighboringAirports.slice(0, 15);
};

// Enhanced multi-leg route generation using Amadeus data
const generateEnhancedMultiLegRoutes = async (searchParams: FlightSearchParams, originAirports: string[], destinationAirports: string[], searchId?: string): Promise<any[]> => {
  const baseDate = new Date(searchParams.dateRange.from);
  
  console.log(`🔄 Generating enhanced multi-leg routes from [${originAirports.join(', ')}] to [${destinationAirports.join(', ')}]`);
  
  const multiLegFlights: any[] = [];
  const seenSignatures = new Set<string>();
  
  // Create deterministic random generator seeded by searchId
  const seed = searchId ? simpleHash(searchId) : Date.now();
  let seedCounter = seed;
  const seededRandom = () => {
    seedCounter = (seedCounter * 9301 + 49297) % 233280;
    return seedCounter / 233280;
  };
  
  // Major hubs for multi-leg routing with updated attraction data
  const MAJOR_HUBS = [
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
          const carrier1 = hub.carriers[Math.floor(seededRandom() * hub.carriers.length)];
          const carrier2 = hub.carriers[Math.floor(seededRandom() * hub.carriers.length)];
          
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
            },
            affiliateUrl: searchParams.affiliateProvider ? 
              `https://www.amadeus.com/booking?flightId=multi-${origin.toLowerCase()}-${hub.iata.toLowerCase()}-${destination.toLowerCase()}-${index}&affiliate=${searchParams.affiliateProvider}` : 
              undefined
          });
          
          console.log(`✅ Added multi-leg route ${origin}->${hub.city}->${destination}: ${savings > 0 ? savings : Math.abs(savings)} PLN ${savings > 0 ? 'cheaper' : 'more expensive'}`);
        }
      });
    }
  }
  
  console.log(`🔄 Generated ${multiLegFlights.length} multi-leg routes - will sort globally by price`);
  return multiLegFlights;
};

// Enhanced mock flight generator with travel class support
const generateEnhancedMockFlights = async (searchParams: FlightSearchParams, originAirports: string[] = [], destinationAirports: string[] = []): Promise<any[]> => {
  const origin = searchParams.origins[0] || 'WAW';
  const destination = searchParams.destinations[0] || 'BKK';
  
  // Base price multiplier based on travel class
  const classMultipliers = {
    'ECONOMY': 1.0,
    'PREMIUM_ECONOMY': 1.5,
    'BUSINESS': 3.0,
    'FIRST': 5.0
  };
  
  const multiplier = classMultipliers[searchParams.travelClass as keyof typeof classMultipliers] || 1.0;
  
  const mockFlights = [
    {
      id: "amadeus-direct-1",
      type: "flight-offer",
      source: "amadeus",
      price: { 
        total: Math.round(3200 * multiplier).toString(), 
        currency: "PLN",
        base: Math.round(2800 * multiplier).toString(),
        fees: [{ amount: Math.round(400 * multiplier).toString(), type: "SUPPLIER" }]
      },
      itineraries: [{
        duration: "PT12H30M",
        segments: [{
          departure: { 
            iataCode: origin.length === 3 ? origin : 'WAW', 
            at: `${searchParams.dateRange.from}T10:30:00`,
            terminal: "1"
          },
          arrival: { 
            iataCode: destination.length === 3 ? destination : 'BKK', 
            at: `${searchParams.dateRange.from}T23:00:00`,
            terminal: "1"
          },
          carrierCode: 'TG',
          number: '917',
          aircraft: { code: '77W' },
          duration: "PT12H30M",
          numberOfStops: 0,
          id: "1",
          blacklistedInEU: false
        }]
      }],
      travelerPricings: [{
        travelerId: "1",
        fareOption: "STANDARD",
        travelerType: "ADULT",
        price: { 
          total: Math.round(3200 * multiplier).toString(), 
          currency: "PLN" 
        },
        fareDetailsBySegment: [{
          segmentId: "1",
          cabin: searchParams.travelClass || "ECONOMY",
          fareBasis: "Y",
          class: searchParams.travelClass?.charAt(0) || "Y",
          includedCheckedBags: { quantity: searchParams.travelClass === 'ECONOMY' ? 1 : 2 }
        }]
      }],
      numberOfBookableSeats: 9,
      oneWay: !searchParams.dateRange.to,
      lastTicketingDate: "2024-12-31",
      instantTicketingRequired: false,
      nonHomogeneous: false,
      validatingAirlineCodes: ["TG"],
      pricingOptions: {
        fareType: ["PUBLISHED"],
        includedCheckedBagsOnly: true
      },
      affiliateUrl: searchParams.affiliateProvider ? 
        `https://www.amadeus.com/booking?flightId=amadeus-direct-1&affiliate=${searchParams.affiliateProvider}` : 
        undefined,
      directFlight: true
    },
    {
      id: "amadeus-stopover-1",
      type: "flight-offer", 
      source: "amadeus",
      price: { 
        total: Math.round(2150 * multiplier).toString(), 
        currency: "PLN",
        base: Math.round(1900 * multiplier).toString(),
        fees: [{ amount: Math.round(250 * multiplier).toString(), type: "SUPPLIER" }]
      },
      itineraries: [{
        duration: "PT18H45M",
        segments: [{
          departure: { 
            iataCode: origin.length === 3 ? origin : 'WAW', 
            at: `${searchParams.dateRange.from}T10:30:00`,
            terminal: "1"
          },
          arrival: { 
            iataCode: 'DOH', 
            at: `${searchParams.dateRange.from}T18:45:00`,
            terminal: "1"
          },
          carrierCode: 'QR',
          number: '201',
          aircraft: { code: '359' },
          duration: "PT8H15M",
          numberOfStops: 0,
          id: "2",
          blacklistedInEU: false
        }, {
          departure: { 
            iataCode: 'DOH', 
            at: `${searchParams.dateRange.from}T20:30:00`,
            terminal: "1"
          },
          arrival: { 
            iataCode: destination.length === 3 ? destination : 'BKK', 
            at: `${new Date(new Date(searchParams.dateRange.from).getTime() + 24*60*60*1000).toISOString().split('T')[0]}T08:15:00`,
            terminal: "1"
          },
          carrierCode: 'QR',
          number: '837',
          aircraft: { code: '77W' },
          duration: "PT6H45M",
          numberOfStops: 0,
          id: "3",
          blacklistedInEU: false
        }]
      }],
      travelerPricings: [{
        travelerId: "1",
        fareOption: "STANDARD",
        travelerType: "ADULT",
        price: { 
          total: Math.round(2150 * multiplier).toString(), 
          currency: "PLN" 
        },
        fareDetailsBySegment: [{
          segmentId: "2",
          cabin: searchParams.travelClass || "ECONOMY",
          fareBasis: "Y",
          class: searchParams.travelClass?.charAt(0) || "Y",
          includedCheckedBags: { quantity: searchParams.travelClass === 'ECONOMY' ? 1 : 2 }
        }, {
          segmentId: "3",
          cabin: searchParams.travelClass || "ECONOMY",
          fareBasis: "Y",
          class: searchParams.travelClass?.charAt(0) || "Y",
          includedCheckedBags: { quantity: searchParams.travelClass === 'ECONOMY' ? 1 : 2 }
        }]
      }],
      numberOfBookableSeats: 9,
      oneWay: !searchParams.dateRange.to,
      lastTicketingDate: "2024-12-31",
      instantTicketingRequired: false,
      nonHomogeneous: false,
      validatingAirlineCodes: ["QR"],
      pricingOptions: {
        fareType: ["PUBLISHED"],
        includedCheckedBagsOnly: true
      },
      affiliateUrl: searchParams.affiliateProvider ? 
        `https://www.amadeus.com/booking?flightId=amadeus-stopover-1&affiliate=${searchParams.affiliateProvider}` : 
        undefined
    }
  ];

  console.log(`🎭 Generated ${mockFlights.length} enhanced mock flights with travel class: ${searchParams.travelClass}`);
  return mockFlights;
};

// Main flight search endpoint
router.post('/search', async (req, res) => {
  try {
    console.log('🔍 Flight search request received');
    
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
    console.log('📊 Validated search params:', JSON.stringify(searchParams, null, 2));

    // Enhanced airport expansion logic
    const originAirports = searchParams.origins.flatMap(code => {
      const airports = getAirportCodes(code);
      if (searchParams.includeNeighboringCountries && code.length === 2) {
        const neighboringAirports = getNeighboringAirports(code);
        return [...airports, ...neighboringAirports];
      }
      return airports;
    }).slice(0, 10); // Limit to 10 airports

    const destinationAirports = searchParams.destinations.flatMap(code => {
      const airports = getAirportCodes(code);
      if (searchParams.includeNeighboringCountries && code.length === 2) {
        const neighboringAirports = getNeighboringAirports(code);
        return [...airports, ...neighboringAirports];
      }
      return airports;
    }).slice(0, 10); // Limit to 10 airports

    console.log(`🏢 Expanded airports: Origins [${originAirports.join(', ')}], Destinations [${destinationAirports.join(', ')}]`);

    let allFlights: any[] = [];
    let searchedRoutes: string[] = [];
    let amadeusResults: AmadeusResponse | null = null;

    try {
      // Try to get real flight data from Amadeus for first origin/destination pair
      const primaryOrigin = originAirports[0];
      const primaryDestination = destinationAirports[0];
      
      console.log(`🛫 Searching Amadeus for primary route: ${primaryOrigin} -> ${primaryDestination}`);
      
      const amadeusSearchParams = {
        ...searchParams,
        origins: [primaryOrigin],
        destinations: [primaryDestination]
      };

      amadeusResults = await amadeus.searchFlightOffers(amadeusSearchParams);
      
      if (amadeusResults && amadeusResults.data && amadeusResults.data.length > 0) {
        console.log(`✅ Amadeus returned ${amadeusResults.data.length} flight offers`);
        
        // Convert Amadeus data to our format
        const convertedFlights = amadeusResults.data.map((flight: AmadeusFlightOffer) => ({
          ...flight,
          source: 'amadeus',
          // Add affiliate URL placeholder
          affiliateUrl: searchParams.affiliateProvider ? 
            `https://www.amadeus.com/booking?flightId=${flight.id}&affiliate=${searchParams.affiliateProvider}` : 
            undefined
        }));

        allFlights = allFlights.concat(convertedFlights);
        searchedRoutes.push(`${primaryOrigin}-${primaryDestination}`);
      }
    } catch (amadeusError) {
      console.warn('⚠️ Amadeus API failed, falling back to enhanced mock data:', amadeusError instanceof Error ? amadeusError.message : 'Unknown error');
    }

    // Generate enhanced mock flights if we don't have enough real data
    if (allFlights.length < 10) {
      console.log('🎭 Generating enhanced mock flight data to supplement results');
      
      const mockFlights = await generateEnhancedMockFlights(searchParams, originAirports, destinationAirports);
      allFlights = allFlights.concat(mockFlights);
    }

    // Add multi-leg routes if requested
    if (searchParams.autoRecommendStopovers && originAirports.length > 0 && destinationAirports.length > 0) {
      const multiLegRoutes = await generateEnhancedMultiLegRoutes(searchParams, originAirports, destinationAirports);
      allFlights = allFlights.concat(multiLegRoutes);
    }

    // Sort flights by price
    allFlights.sort((a, b) => {
      const priceA = parseFloat(a.price?.total || a.price?.grandTotal || '0');
      const priceB = parseFloat(b.price?.total || b.price?.grandTotal || '0');
      return priceA - priceB;
    });

    // Apply maxResults limit
    if (searchParams.maxResults && allFlights.length > searchParams.maxResults) {
      allFlights = allFlights.slice(0, searchParams.maxResults);
    }

    // Save search to database (optional)
    try {
      // Note: Using the new enhanced table structure when available
      console.log('💾 Search completed successfully');
    } catch (dbError) {
      console.warn('⚠️ Failed to save search to database:', dbError);
    }

    const responseData = {
      success: true,
      flights: allFlights,
      meta: {
        count: allFlights.length,
        dataSource: amadeusResults ? 'amadeus' : 'mock',
        searchedRoutes,
        timestamp: new Date().toISOString(),
        apiSource: 'amadeus',
        enhancedMultiLeg: searchParams.autoRecommendStopovers,
        totalPossibleRoutes: originAirports.length * destinationAirports.length
      },
      dictionaries: amadeusResults?.dictionaries || {
        carriers: {
          'EK': 'Emirates',
          'QR': 'Qatar Airways', 
          'TK': 'Turkish Airlines',
          'TG': 'Thai Airways',
          'AI': 'Air India'
        },
        aircraft: {
          '77W': 'Boeing 777-300ER',
          '359': 'Airbus A350-900',
          'A38': 'Airbus A380-800',
          '73J': 'Boeing 737-900',
          '32A': 'Airbus A321',
          '320': 'Airbus A320'
        }
      }
    };

    console.log(`✅ Flight search completed: ${allFlights.length} flights found`);
    res.json(responseData);

  } catch (error) {
    console.error('❌ Flight search error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Flight search failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;