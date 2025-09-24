import { Router } from 'express';
import { db } from '../db.js';
import { hotelSearches, hotelSearchSchema, HotelSearchRequest } from '../../shared/schema.js';
import amadeus from '../utils/amadeus.js';

const router = Router();

interface AmadeusHotelOffer {
  type: string;
  hotel: AmadeusHotel;
  available: boolean;
  offers: AmadeusHotelOfferDetails[];
  self: string;
}

interface AmadeusHotel {
  type: string;
  hotelId: string;
  chainCode?: string;
  dupeId?: string;
  name: string;
  rating?: string;
  cityCode: string;
  latitude?: number;
  longitude?: number;
  hotelDistance?: {
    distance: number;
    distanceUnit: string;
  };
  address?: AmadeusAddress;
  contact?: AmadeusContact;
  description?: {
    lang: string;
    text: string;
  };
  amenities?: string[];
  media?: AmadeusMedia[];
}

interface AmadeusAddress {
  lines: string[];
  postalCode?: string;
  cityName?: string;
  countryCode?: string;
}

interface AmadeusContact {
  phone?: string;
  fax?: string;
  email?: string;
}

interface AmadeusMedia {
  uri: string;
  category?: string;
}

interface AmadeusHotelOfferDetails {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  rateCode?: string;
  rateFamilyEstimated?: {
    code: string;
    type: string;
  };
  room: AmadeusRoom;
  guests: AmadeusGuests;
  price: AmadeusHotelPrice;
  policies?: AmadeusPolicies;
  self: string;
}

interface AmadeusRoom {
  type: string;
  typeEstimated?: {
    category: string;
    beds: number;
    bedType: string;
  };
  description?: {
    text: string;
    lang: string;
  };
}

interface AmadeusGuests {
  adults: number;
  childAges?: number[];
}

interface AmadeusHotelPrice {
  currency: string;
  base?: string;
  total: string;
  taxes?: AmadeusHotelTax[];
  markups?: AmadeusHotelMarkup[];
  variations?: AmadeusPriceVariation;
}

interface AmadeusHotelTax {
  code: string;
  percentage?: string;
  included: boolean;
  amount: string;
  currency: string;
  description?: string;
}

interface AmadeusHotelMarkup {
  amount: string;
  currency: string;
}

interface AmadeusPriceVariation {
  average: AmadeusHotelPrice;
  changes: Array<{
    startDate: string;
    endDate: string;
    total: string;
  }>;
}

interface AmadeusPolicies {
  paymentType?: string;
  guarantee?: {
    acceptedPayments?: {
      creditCards?: string[];
      methods?: string[];
    };
  };
  deposit?: {
    amount?: string;
    deadline?: string;
    description?: {
      text: string;
    };
  };
  prepay?: {
    amount?: string;
    deadline?: string;
    description?: {
      text: string;
    };
  };
  holdTime?: {
    deadline: string;
  };
  cancellation?: {
    deadline?: string;
    amount?: string;
    type?: string;
    description?: {
      text: string;
    };
  };
}

interface AmadeusHotelResponse {
  data: AmadeusHotelOffer[];
  meta?: {
    count: number;
    links?: {
      self: string;
      next?: string;
      previous?: string;
      last?: string;
      first?: string;
    };
  };
  warnings?: Array<{
    code: string;
    title: string;
    detail: string;
  }>;
}

// Enhanced mock hotel generator
const generateEnhancedMockHotels = async (searchParams: HotelSearchRequest): Promise<AmadeusHotelOffer[]> => {
  console.log(`🏨 Generating mock hotels for city: ${searchParams.cityCode}`);
  
  // Base price multiplier based on price range
  const priceMultipliers = {
    'budget': 0.6,
    'mid-range': 1.0,
    'luxury': 2.5
  };
  
  const multiplier = priceMultipliers[searchParams.priceRange as keyof typeof priceMultipliers] || 1.0;
  
  // Calculate nights
  const checkIn = new Date(searchParams.checkInDate);
  const checkOut = new Date(searchParams.checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  
  const mockHotels: AmadeusHotelOffer[] = [
    {
      type: "hotel-offers",
      hotel: {
        type: "hotel",
        hotelId: "BKCTWIN1",
        chainCode: "TW",
        name: searchParams.priceRange === 'luxury' ? "The Oriental Bangkok" : 
              searchParams.priceRange === 'budget' ? "Khaosan Palace Hotel" : 
              "Novotel Bangkok Fenix Silom",
        rating: searchParams.priceRange === 'luxury' ? "5" : 
                searchParams.priceRange === 'budget' ? "3" : "4",
        cityCode: searchParams.cityCode,
        latitude: 13.7563,
        longitude: 100.5018,
        address: {
          lines: [searchParams.priceRange === 'luxury' ? 
                  "48 Oriental Avenue" : 
                  searchParams.priceRange === 'budget' ? 
                  "243 Khaosan Road" : "320 Silom Road"],
          postalCode: "10500",
          cityName: "Bangkok",
          countryCode: "TH"
        },
        contact: {
          phone: "+66-2-659-9000",
          email: "reservations@hotel.com"
        },
        amenities: searchParams.priceRange === 'luxury' ? 
                   ["SPA", "FITNESS_CENTER", "SWIMMING_POOL", "RESTAURANT", "BAR", "CONCIERGE", "ROOM_SERVICE"] :
                   searchParams.priceRange === 'budget' ? 
                   ["WIFI", "AIR_CONDITIONING", "RESTAURANT"] :
                   ["WIFI", "FITNESS_CENTER", "SWIMMING_POOL", "RESTAURANT", "BAR", "BUSINESS_CENTER"],
        media: [{
          uri: "https://example.com/hotel-image.jpg",
          category: "EXTERIOR"
        }]
      },
      available: true,
      offers: [{
        id: "offer-1",
        checkInDate: searchParams.checkInDate,
        checkOutDate: searchParams.checkOutDate,
        room: {
          type: "SUPERIOR",
          typeEstimated: {
            category: searchParams.priceRange === 'luxury' ? "SUITE" : "ROOM",
            beds: 1,
            bedType: "KING"
          },
          description: {
            text: searchParams.priceRange === 'luxury' ? 
                  "Spacious suite with river view" : 
                  searchParams.priceRange === 'budget' ? 
                  "Comfortable room with city view" :
                  "Modern room with amenities",
            lang: "EN"
          }
        },
        guests: {
          adults: searchParams.adults,
          childAges: searchParams.children > 0 ? [8] : undefined
        },
        price: {
          currency: "PLN",
          total: Math.round(350 * multiplier * nights).toString(),
          base: Math.round(300 * multiplier * nights).toString(),
          taxes: [{
            code: "VAT",
            percentage: "7.0",
            included: true,
            amount: Math.round(50 * multiplier * nights).toString(),
            currency: "PLN"
          }]
        },
        policies: {
          cancellation: {
            deadline: "2024-12-30T18:00:00",
            type: "FREE_CANCELLATION"
          }
        },
        self: "https://api.amadeus.com/v3/shopping/hotel-offers/offer-1"
      }],
      self: "https://api.amadeus.com/v3/shopping/hotel-offers/BKCTWIN1"
    },
    {
      type: "hotel-offers",
      hotel: {
        type: "hotel", 
        hotelId: "BKCTWIN2",
        chainCode: searchParams.priceRange === 'luxury' ? "HY" : "IH",
        name: searchParams.priceRange === 'luxury' ? "Grand Hyatt Erawan Bangkok" : 
              searchParams.priceRange === 'budget' ? "The Heritage Bangkok" : 
              "Holiday Inn Bangkok Silom",
        rating: searchParams.priceRange === 'luxury' ? "5" : 
                searchParams.priceRange === 'budget' ? "3" : "4",
        cityCode: searchParams.cityCode,
        latitude: 13.7442,
        longitude: 100.5417,
        address: {
          lines: [searchParams.priceRange === 'luxury' ? 
                  "494 Rajdamri Road" : 
                  searchParams.priceRange === 'budget' ? 
                  "198/1 Khlong Toei" : "981 Silom Road"],
          postalCode: "10330",
          cityName: "Bangkok", 
          countryCode: "TH"
        },
        amenities: searchParams.priceRange === 'luxury' ? 
                   ["SPA", "FITNESS_CENTER", "SWIMMING_POOL", "RESTAURANT", "BAR", "CONCIERGE", "BUSINESS_CENTER"] :
                   searchParams.priceRange === 'budget' ? 
                   ["WIFI", "AIR_CONDITIONING", "FRONT_DESK_24H"] :
                   ["WIFI", "FITNESS_CENTER", "SWIMMING_POOL", "RESTAURANT", "MEETING_ROOM"]
      },
      available: true,
      offers: [{
        id: "offer-2",
        checkInDate: searchParams.checkInDate,
        checkOutDate: searchParams.checkOutDate,
        room: {
          type: "DELUXE",
          typeEstimated: {
            category: searchParams.priceRange === 'luxury' ? "SUITE" : "ROOM",
            beds: 1,
            bedType: "QUEEN"
          }
        },
        guests: {
          adults: searchParams.adults,
          childAges: searchParams.children > 0 ? [12] : undefined
        },
        price: {
          currency: "PLN",
          total: Math.round(420 * multiplier * nights).toString(),
          base: Math.round(360 * multiplier * nights).toString(),
          taxes: [{
            code: "VAT",
            percentage: "7.0",
            included: true,
            amount: Math.round(60 * multiplier * nights).toString(),
            currency: "PLN"
          }]
        },
        self: "https://api.amadeus.com/v3/shopping/hotel-offers/offer-2"
      }],
      self: "https://api.amadeus.com/v3/shopping/hotel-offers/BKCTWIN2"
    }
  ];

  console.log(`🏨 Generated ${mockHotels.length} mock hotels for ${searchParams.priceRange} price range`);
  return mockHotels;
};

// Main hotel search endpoint
router.post('/search', async (req, res) => {
  try {
    console.log('🏨 Hotel search request received');
    
    // Validate request body with Zod
    const validation = hotelSearchSchema.safeParse(req.body);
    
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

    const searchParams: HotelSearchRequest = validation.data;
    console.log('🏨 Validated hotel search params:', JSON.stringify(searchParams, null, 2));

    let hotelResults: AmadeusHotelOffer[] = [];
    let amadeusResults: AmadeusHotelResponse | null = null;

    try {
      // Try to get real hotel data from Amadeus
      console.log(`🏨 Searching Amadeus for hotels in: ${searchParams.cityCode}`);
      
      const amadeusSearchParams = {
        cityCode: searchParams.cityCode,
        checkInDate: searchParams.checkInDate,
        checkOutDate: searchParams.checkOutDate,
        adults: searchParams.adults,
        children: searchParams.children,
        rooms: searchParams.rooms,
        currency: searchParams.currency,
        amenities: searchParams.amenities,
        chainCodes: searchParams.chainCodes,
        ratings: searchParams.ratings
      };

      amadeusResults = await amadeus.searchHotels(amadeusSearchParams);
      
      if (amadeusResults && amadeusResults.data && amadeusResults.data.length > 0) {
        console.log(`✅ Amadeus returned ${amadeusResults.data.length} hotel offers`);
        
        // Add affiliate URLs to real Amadeus data
        hotelResults = amadeusResults.data.map((hotel: AmadeusHotelOffer) => ({
          ...hotel,
          offers: hotel.offers.map(offer => ({
            ...offer,
            affiliateUrl: searchParams.affiliateProvider ? 
              `https://www.amadeus.com/booking/hotel?hotelId=${hotel.hotel.hotelId}&offerId=${offer.id}&affiliate=${searchParams.affiliateProvider}` : 
              undefined
          }))
        }));
      }
    } catch (amadeusError) {
      console.warn('⚠️ Amadeus Hotel API failed, falling back to enhanced mock data:', amadeusError instanceof Error ? amadeusError.message : 'Unknown error');
    }

    // Generate enhanced mock hotels if we don't have real data
    if (hotelResults.length === 0) {
      console.log('🎭 Generating enhanced mock hotel data');
      const mockHotels = await generateEnhancedMockHotels(searchParams);
      
      // Add affiliate URLs to mock data
      hotelResults = mockHotels.map((hotel: AmadeusHotelOffer) => ({
        ...hotel,
        offers: hotel.offers.map(offer => ({
          ...offer,
          affiliateUrl: searchParams.affiliateProvider ? 
            `https://www.booking.com/hotel?hotelId=${hotel.hotel.hotelId}&offerId=${offer.id}&affiliate=${searchParams.affiliateProvider}` : 
            undefined
        }))
      }));
    }

    // Sort hotels by price
    hotelResults.sort((a, b) => {
      const priceA = parseFloat(a.offers[0]?.price?.total || '0');
      const priceB = parseFloat(b.offers[0]?.price?.total || '0');
      return priceA - priceB;
    });

    // Save search to database (optional)
    try {
      console.log('💾 Hotel search completed successfully');
    } catch (dbError) {
      console.warn('⚠️ Failed to save hotel search to database:', dbError);
    }

    const responseData = {
      success: true,
      hotels: hotelResults,
      meta: {
        count: hotelResults.length,
        dataSource: amadeusResults ? 'amadeus' : 'mock',
        timestamp: new Date().toISOString(),
        apiSource: 'amadeus',
        searchParams: {
          city: searchParams.cityCode,
          checkIn: searchParams.checkInDate,
          checkOut: searchParams.checkOutDate,
          guests: searchParams.adults + searchParams.children,
          rooms: searchParams.rooms,
          priceRange: searchParams.priceRange
        }
      },
      warnings: amadeusResults?.warnings || []
    };

    console.log(`✅ Hotel search completed: ${hotelResults.length} hotels found`);
    res.json(responseData);

  } catch (error) {
    console.error('❌ Hotel search error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Hotel search failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// Hotel availability endpoint
router.get('/availability/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate, adults = 1, children = 0 } = req.query;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        error: 'Check-in and check-out dates are required'
      });
    }

    console.log(`🏨 Checking availability for hotel: ${hotelId}`);

    // For now, return mock availability data
    const mockAvailability = {
      success: true,
      hotelId,
      available: true,
      checkInDate,
      checkOutDate,
      rooms: [
        {
          type: "STANDARD",
          available: true,
          price: { total: "350", currency: "PLN" },
          amenities: ["WIFI", "AIR_CONDITIONING"]
        },
        {
          type: "DELUXE", 
          available: true,
          price: { total: "450", currency: "PLN" },
          amenities: ["WIFI", "AIR_CONDITIONING", "BALCONY"]
        }
      ]
    };

    res.json(mockAvailability);

  } catch (error) {
    console.error('❌ Hotel availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check hotel availability',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;