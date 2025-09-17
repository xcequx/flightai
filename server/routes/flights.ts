import express from 'express';
import { Router } from 'express';
import { db } from '../db.js';
import { flightSearches } from '../../shared/schema.js';

const router = Router();

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

router.post('/search', async (req, res) => {
  try {
    const amadeusApiKey = process.env.AMADEUS_API_KEY;
    const amadeusApiSecret = process.env.AMADEUS_API_SECRET;

    if (!amadeusApiKey || !amadeusApiSecret) {
      return res.status(500).json({
        success: false,
        error: 'Amadeus API credentials not configured'
      });
    }

    const searchParams: FlightSearchParams = req.body;
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
      return res.status(500).json({
        success: false,
        error: `Failed to get Amadeus token: ${tokenResponse.status}`
      });
    }

    const tokenData: AmadeusTokenResponse = await tokenResponse.json();
    console.log('Successfully obtained Amadeus token');

    // For now, we'll search for flights between the first origin and destination
    // In a real implementation, we'd handle multiple origins/destinations and stopovers
    const origin = searchParams.origins[0];
    const destination = searchParams.destinations[0];

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination are required'
      });
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
      
      // Additional European countries
      'CZ': ['PRG', 'BRQ'], // Czech Republic - Prague, Brno
      'SK': ['BTS'], // Slovakia - Bratislava
      'AT': ['VIE', 'SZG', 'INN'], // Austria - Vienna, Salzburg, Innsbruck
      'CH': ['ZUR', 'GVA', 'BSL'], // Switzerland - Zurich, Geneva, Basel
      'BE': ['BRU', 'ANR', 'CRL'], // Belgium - Brussels, Antwerp, Charleroi
      'DK': ['CPH', 'AAL', 'BLL'], // Denmark - Copenhagen, Aalborg, Billund
      'SE': ['ARN', 'GOT', 'MMX'], // Sweden - Stockholm, Gothenburg, Malmö
      'NO': ['OSL', 'BGO', 'TRD'], // Norway - Oslo, Bergen, Trondheim
      'FI': ['HEL', 'TMP', 'OUL'], // Finland - Helsinki, Tampere, Oulu
      'PT': ['LIS', 'OPO', 'FAO'], // Portugal - Lisbon, Porto, Faro
      'IE': ['DUB', 'ORK', 'SNN'], // Ireland - Dublin, Cork, Shannon
      'GR': ['ATH', 'SKG', 'HER'], // Greece - Athens, Thessaloniki, Heraklion
      'HR': ['ZAG', 'SPU', 'DBV'], // Croatia - Zagreb, Split, Dubrovnik
      'SI': ['LJU'], // Slovenia - Ljubljana
      'HU': ['BUD'], // Hungary - Budapest
      'RO': ['OTP', 'CLJ'], // Romania - Bucharest, Cluj
      'BG': ['SOF', 'BOJ'], // Bulgaria - Sofia, Bourgas
      'RS': ['BEG'], // Serbia - Belgrade
      'LT': ['VNO'], // Lithuania - Vilnius
      'LV': ['RIX'], // Latvia - Riga
      'EE': ['TLL'], // Estonia - Tallinn
      
      // Additional Middle Eastern countries
      'SA': ['RUH', 'JED', 'DMM'], // Saudi Arabia - Riyadh, Jeddah, Dammam
      'KW': ['KWI'], // Kuwait
      'BH': ['BAH'], // Bahrain
      'OM': ['MCT'], // Oman - Muscat
      'JO': ['AMM'], // Jordan - Amman
      'IL': ['TLV'], // Israel - Tel Aviv
      'LB': ['BEY'], // Lebanon - Beirut
      'IR': ['IKA', 'SYZ'], // Iran - Tehran, Shiraz
      
      // Additional African countries
      'ZA': ['JNB', 'CPT', 'DUR'], // South Africa - Johannesburg, Cape Town, Durban
      'NG': ['LOS', 'ABV'], // Nigeria - Lagos, Abuja
      'KE': ['NBO', 'MBA'], // Kenya - Nairobi, Mombasa
      'ET': ['ADD'], // Ethiopia - Addis Ababa
      'MA': ['CMN', 'RAK'], // Morocco - Casablanca, Marrakech
      'TN': ['TUN'], // Tunisia - Tunis
      'DZ': ['ALG'], // Algeria - Algiers
      
      // Additional Asian countries
      'PH': ['MNL', 'CEB'], // Philippines - Manila, Cebu
      'TW': ['TPE', 'KHH'], // Taiwan - Taipei, Kaohsiung
      'BD': ['DAC'], // Bangladesh - Dhaka
      'LK': ['CMB'], // Sri Lanka - Colombo
      'NP': ['KTM'], // Nepal - Kathmandu
      'MM': ['RGN'], // Myanmar - Yangon
      'LA': ['VTE'], // Laos - Vientiane
      'KH': ['PNH'], // Cambodia - Phnom Penh
      'BN': ['BWN'], // Brunei
      'PK': ['KHI', 'LHE', 'ISB'], // Pakistan - Karachi, Lahore, Islamabad
      
      // Additional American countries
      'MX': ['MEX', 'CUN', 'GDL'], // Mexico - Mexico City, Cancun, Guadalajara
      'BR': ['GRU', 'GIG', 'BSB', 'FOR'], // Brazil - São Paulo, Rio, Brasília, Fortaleza
      'AR': ['EZE', 'AEP'], // Argentina - Buenos Aires international and domestic
      'CL': ['SCL'], // Chile - Santiago
      'PE': ['LIM'], // Peru - Lima
      'CO': ['BOG', 'CTG'], // Colombia - Bogotá, Cartagena
      'VE': ['CCS'], // Venezuela - Caracas
      'UY': ['MVD'], // Uruguay - Montevideo
      'PY': ['ASU'], // Paraguay - Asunción
      'BO': ['LPB', 'VVI'], // Bolivia - La Paz, Santa Cruz
      'EC': ['UIO', 'GYE'], // Ecuador - Quito, Guayaquil
      'PA': ['PTY'], // Panama
      'CR': ['SJO'], // Costa Rica
      'GT': ['GUA'], // Guatemala
      
      // Additional Oceania
      'NZ': ['AKL', 'WLG', 'CHC'], // New Zealand - Auckland, Wellington, Christchurch
      'FJ': ['NAN'], // Fiji - Nadi
      'NC': ['NOU'], // New Caledonia - Nouméa
      'PF': ['PPT'], // French Polynesia - Tahiti
    };

    const getAirportCodes = (code: string): string[] => {
      // If it's already an airport code (3 letters), return it
      if (code.length === 3) return [code];
      // If it's a country code, return mapped airports
      if (airportMap[code]) return airportMap[code];
      // Default fallback
      return ['WAW']; // Default to Warsaw if no mapping found
    };

    // Comprehensive neighboring countries and major hub mapping
    const neighboringCountriesMap: { [key: string]: string[] } = {
      // European Countries
      'PL': ['DE', 'CZ', 'SK', 'UA', 'BY', 'LT'], // Poland neighbors
      'DE': ['PL', 'CZ', 'AT', 'CH', 'FR', 'BE', 'NL', 'DK'], // Germany neighbors
      'FR': ['ES', 'IT', 'DE', 'CH', 'BE', 'GB'], // France neighbors  
      'IT': ['FR', 'CH', 'AT', 'SI', 'ES'], // Italy neighbors
      'ES': ['FR', 'PT', 'IT'], // Spain neighbors
      'GB': ['FR', 'IE', 'NL', 'BE'], // UK neighbors
      'NL': ['DE', 'BE', 'GB', 'FR'], // Netherlands neighbors
      'BE': ['FR', 'NL', 'DE', 'GB'], // Belgium neighbors
      'CH': ['DE', 'FR', 'IT', 'AT'], // Switzerland neighbors
      'AT': ['DE', 'IT', 'CH', 'SI', 'CZ', 'SK'], // Austria neighbors
      'CZ': ['DE', 'PL', 'AT', 'SK'], // Czech Republic neighbors
      'SK': ['CZ', 'PL', 'AT', 'UA'], // Slovakia neighbors
      'HU': ['AT', 'SK', 'RO', 'RS', 'HR', 'SI'], // Hungary neighbors
      'RO': ['HU', 'BG', 'RS', 'UA', 'MD'], // Romania neighbors
      'BG': ['RO', 'GR', 'TR', 'RS'], // Bulgaria neighbors
      'GR': ['BG', 'TR', 'AL', 'MK'], // Greece neighbors
      'TR': ['GR', 'BG', 'GE', 'AM', 'IR', 'IQ', 'SY'], // Turkey neighbors
      'SE': ['NO', 'FI', 'DK'], // Sweden neighbors
      'NO': ['SE', 'FI', 'DK'], // Norway neighbors
      'FI': ['SE', 'NO', 'RU', 'EE'], // Finland neighbors
      'DK': ['DE', 'SE', 'NO'], // Denmark neighbors
      'PT': ['ES'], // Portugal neighbors
      'IE': ['GB'], // Ireland neighbors

      // North American Countries  
      'US': ['CA', 'MX'], // USA neighbors
      'CA': ['US'], // Canada neighbors
      'MX': ['US', 'GT'], // Mexico neighbors

      // Asian Countries
      'CN': ['RU', 'MN', 'KZ', 'KG', 'TJ', 'AF', 'PK', 'IN', 'NP', 'BT', 'MM', 'LA', 'VN', 'KP', 'KR'], // China neighbors
      'IN': ['PK', 'CN', 'NP', 'BT', 'MM', 'BD', 'LK'], // India neighbors
      'JP': ['KR', 'CN', 'RU'], // Japan neighbors (maritime neighbors)
      'KR': ['CN', 'KP', 'JP'], // South Korea neighbors
      'TH': ['MM', 'LA', 'KH', 'MY'], // Thailand neighbors
      'VN': ['CN', 'LA', 'KH'], // Vietnam neighbors
      'MY': ['TH', 'SG', 'ID', 'BN'], // Malaysia neighbors
      'SG': ['MY', 'ID'], // Singapore neighbors
      'ID': ['MY', 'SG', 'TL', 'PG'], // Indonesia neighbors
      'PH': ['TW', 'CN', 'MY', 'ID'], // Philippines neighbors (maritime)

      // Middle Eastern Countries
      'AE': ['SA', 'OM', 'QA', 'IR'], // UAE neighbors
      'SA': ['AE', 'OM', 'YE', 'QA', 'BH', 'KW', 'IQ', 'JO'], // Saudi Arabia neighbors
      'QA': ['SA', 'AE', 'BH'], // Qatar neighbors
      'KW': ['SA', 'IQ'], // Kuwait neighbors
      'BH': ['SA', 'QA'], // Bahrain neighbors
      'OM': ['AE', 'SA', 'YE'], // Oman neighbors
      'IR': ['TR', 'IQ', 'AF', 'PK', 'TM', 'AZ', 'AM'], // Iran neighbors
      'IQ': ['IR', 'TR', 'SY', 'JO', 'SA', 'KW'], // Iraq neighbors
      'JO': ['IQ', 'SA', 'SY', 'IL', 'PS'], // Jordan neighbors
      'IL': ['JO', 'SY', 'LB', 'EG', 'PS'], // Israel neighbors
      'EG': ['LY', 'SD', 'IL', 'PS'], // Egypt neighbors

      // African Countries
      'ZA': ['NA', 'BW', 'ZW', 'MZ', 'SZ', 'LS'], // South Africa neighbors
      'NG': ['NE', 'TD', 'CM', 'BJ'], // Nigeria neighbors
      'KE': ['ET', 'SO', 'TZ', 'UG', 'SS'], // Kenya neighbors
      'ET': ['ER', 'DJ', 'SO', 'KE', 'SS', 'SD'], // Ethiopia neighbors
      'MA': ['DZ', 'ES'], // Morocco neighbors (+ Spain via Ceuta/Melilla)
      'TN': ['DZ', 'LY'], // Tunisia neighbors
      'DZ': ['MA', 'TN', 'LY', 'NE', 'ML', 'MR'], // Algeria neighbors

      // Oceania
      'AU': ['NZ', 'PG', 'ID', 'TL'], // Australia neighbors (maritime)
      'NZ': ['AU'], // New Zealand neighbors

      // South American Countries
      'BR': ['UY', 'AR', 'PY', 'BO', 'PE', 'CO', 'VE', 'GY', 'SR', 'GF'], // Brazil neighbors
      'AR': ['CL', 'BO', 'PY', 'BR', 'UY'], // Argentina neighbors
      'CL': ['AR', 'BO', 'PE'], // Chile neighbors
      'PE': ['EC', 'CO', 'BR', 'BO', 'CL'], // Peru neighbors
      'CO': ['VE', 'GY', 'BR', 'PE', 'EC', 'PA'], // Colombia neighbors
      'VE': ['CO', 'GY', 'BR'], // Venezuela neighbors
    };

    // Major aviation hubs that serve as alternatives for regions
    const regionalHubsMap: { [key: string]: string[] } = {
      // European hubs
      'EUROPE': ['DE', 'FR', 'NL', 'GB', 'TR', 'QA'], 
      // Asian hubs  
      'ASIA': ['SG', 'AE', 'QA', 'TR', 'TH', 'JP', 'KR'],
      // Middle Eastern hubs
      'MIDDLE_EAST': ['AE', 'QA', 'TR', 'EG'],
      // African hubs
      'AFRICA': ['EG', 'ET', 'ZA', 'MA', 'KE'],
      // American hubs
      'AMERICAS': ['US', 'CA', 'MX', 'BR', 'PA'],
      // Oceania hubs
      'OCEANIA': ['AU', 'NZ', 'SG']
    };

    // Function to get neighboring countries with intelligent hub selection
    const getNeighboringCountries = (countryCode: string): string[] => {
      const directNeighbors = neighboringCountriesMap[countryCode] || [];
      const neighbors = [...directNeighbors];

      // Add regional hubs based on geographical region
      const europeanCountries = ['PL', 'DE', 'FR', 'IT', 'ES', 'GB', 'NL', 'BE', 'CH', 'AT', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'SE', 'NO', 'FI', 'DK', 'PT', 'IE'];
      const asianCountries = ['CN', 'IN', 'JP', 'KR', 'TH', 'VN', 'MY', 'ID', 'PH', 'SG'];
      const middleEasternCountries = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IR', 'IQ', 'JO', 'IL', 'TR'];
      const africanCountries = ['ZA', 'NG', 'KE', 'ET', 'MA', 'TN', 'DZ', 'EG'];
      const americanCountries = ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'PE', 'CO', 'VE'];

      // Add regional hubs if not already included
      if (europeanCountries.includes(countryCode)) {
        regionalHubsMap.EUROPE.forEach(hub => {
          if (!neighbors.includes(hub) && hub !== countryCode) neighbors.push(hub);
        });
      } else if (asianCountries.includes(countryCode)) {
        regionalHubsMap.ASIA.forEach(hub => {
          if (!neighbors.includes(hub) && hub !== countryCode) neighbors.push(hub);
        });
      } else if (middleEasternCountries.includes(countryCode)) {
        regionalHubsMap.MIDDLE_EAST.forEach(hub => {
          if (!neighbors.includes(hub) && hub !== countryCode) neighbors.push(hub);
        });
      } else if (africanCountries.includes(countryCode)) {
        regionalHubsMap.AFRICA.forEach(hub => {
          if (!neighbors.includes(hub) && hub !== countryCode) neighbors.push(hub);
        });
      } else if (americanCountries.includes(countryCode)) {
        regionalHubsMap.AMERICAS.forEach(hub => {
          if (!neighbors.includes(hub) && hub !== countryCode) neighbors.push(hub);
        });
      }

      return neighbors.slice(0, 6); // Limit to 6 neighboring countries for performance
    };

    // Function to select best airports from neighboring countries
    const selectNeighboringAirports = (neighborCountries: string[], maxAirports: number = 4): string[] => {
      const selectedAirports: string[] = [];
      
      for (const country of neighborCountries) {
        const countryAirports = airportMap[country] || [];
        if (countryAirports.length > 0) {
          // Prioritize major hubs (first airport is usually the main hub)
          selectedAirports.push(countryAirports[0]);
          
          // Add secondary airport if it's a major country and we have space
          if (selectedAirports.length < maxAirports && countryAirports.length > 1) {
            const majorCountries = ['DE', 'FR', 'IT', 'ES', 'GB', 'US', 'CN', 'JP', 'IN', 'BR', 'AU'];
            if (majorCountries.includes(country)) {
              selectedAirports.push(countryAirports[1]);
            }
          }
          
          if (selectedAirports.length >= maxAirports) break;
        }
      }
      
      return selectedAirports;
    };

    const originAirports = getAirportCodes(origin);
    const destinationAirports = getAirportCodes(destination);

    // If including neighboring countries, expand search for both origins and destinations
    if (searchParams.includeNeighboringCountries) {
      console.log('🌍 Including neighboring countries in search');
      
      // Expand origin airports with neighbors
      for (const originCountry of searchParams.origins) {
        if (originCountry.length === 2) { // Only for country codes, not airport codes
          const neighboringCountries = getNeighboringCountries(originCountry);
          const neighboringAirports = selectNeighboringAirports(neighboringCountries, 3);
          
          console.log(`📍 Origin ${originCountry}: Adding neighboring airports from [${neighboringCountries.slice(0, 3).join(', ')}]: [${neighboringAirports.join(', ')}]`);
          originAirports.push(...neighboringAirports);
        }
      }
      
      // Expand destination airports with neighbors  
      for (const destinationCountry of searchParams.destinations) {
        if (destinationCountry.length === 2) { // Only for country codes, not airport codes
          const neighboringCountries = getNeighboringCountries(destinationCountry);
          const neighboringAirports = selectNeighboringAirports(neighboringCountries, 3);
          
          console.log(`🎯 Destination ${destinationCountry}: Adding neighboring airports from [${neighboringCountries.slice(0, 3).join(', ')}]: [${neighboringAirports.join(', ')}]`);
          destinationAirports.push(...neighboringAirports);
        }
      }
    }

    // Create search combinations from all available airports
    const searchCombinations: { origin: string; destination: string }[] = [];
    for (let i = 0; i < Math.min(originAirports.length, 3); i++) {
      for (let j = 0; j < Math.min(destinationAirports.length, 3); j++) {
        searchCombinations.push({
          origin: originAirports[i],
          destination: destinationAirports[j]
        });
        if (searchCombinations.length >= 4) break; // Limit to 4 combinations to avoid rate limiting
      }
      if (searchCombinations.length >= 4) break;
    }

    console.log(`🔍 Will search ${searchCombinations.length} route combinations:`, 
      searchCombinations.map(combo => `${combo.origin}->${combo.destination}`).join(', '));
    
    // Format dates for Amadeus API (YYYY-MM-DD format)
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    const departureDate = formatDate(searchParams.dateRange.from);
    const returnDate = searchParams.dateRange.to ? formatDate(searchParams.dateRange.to) : null;

    // Function to search flights for a specific combination
    const searchFlightCombination = async (combination: { origin: string; destination: string }) => {
      const flightSearchUrl = new URL('https://test.api.amadeus.com/v2/shopping/flight-offers');
      
      // Basic required parameters
      flightSearchUrl.searchParams.set('originLocationCode', combination.origin);
      flightSearchUrl.searchParams.set('destinationLocationCode', combination.destination);
      flightSearchUrl.searchParams.set('departureDate', departureDate);
      if (returnDate) {
        flightSearchUrl.searchParams.set('returnDate', returnDate);
      }
      
      // Passenger configuration
      flightSearchUrl.searchParams.set('adults', '1');
      
      // Currency - important for Polish users
      flightSearchUrl.searchParams.set('currencyCode', 'PLN');
      
      // Result limits - reasonable number for test environment
      flightSearchUrl.searchParams.set('max', '25'); // Reduced per search to stay under API limits
      
      // Allow connections for more options
      flightSearchUrl.searchParams.set('nonStop', 'false');
      
      // Travel class
      flightSearchUrl.searchParams.set('travelClass', 'ECONOMY');

      console.log(`Searching ${combination.origin} -> ${combination.destination}:`, flightSearchUrl.toString());

      const response = await fetch(flightSearchUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Search failed for ${combination.origin} -> ${combination.destination}:`, errorText);
        throw new Error(`Flight search failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        combination,
        data: data.data || [],
        meta: data.meta || {},
        dictionaries: data.dictionaries || {}
      };
    };

    // Execute searches for all combinations with Promise.allSettled to handle failures gracefully
    const searchPromises = searchCombinations.map(combination => 
      searchFlightCombination(combination).catch(error => ({ 
        combination, 
        error: error.message,
        data: [],
        meta: {},
        dictionaries: {}
      }))
    );

    const searchResults = await Promise.allSettled(searchPromises);
    
    // Aggregate results from all successful searches
    let allFlights: any[] = [];
    let combinedMeta: any = {};
    let combinedDictionaries: any = {};
    const searchedRoutes: string[] = [];
    const failedRoutes: string[] = [];

    for (const result of searchResults) {
      if (result.status === 'fulfilled') {
        const searchResult = result.value;
        if (!('error' in searchResult)) {
          allFlights.push(...searchResult.data);
          searchedRoutes.push(`${searchResult.combination.origin}->${searchResult.combination.destination}`);
          
          // Merge dictionaries and meta data
          Object.assign(combinedDictionaries, searchResult.dictionaries);
          if (Object.keys(combinedMeta).length === 0) {
            combinedMeta = searchResult.meta;
          }
          
          console.log(`✅ Found ${searchResult.data.length} flights for ${searchResult.combination.origin} -> ${searchResult.combination.destination}`);
        } else {
          failedRoutes.push(`${searchResult.combination.origin}->${searchResult.combination.destination}`);
          console.log(`❌ Search failed for ${searchResult.combination.origin} -> ${searchResult.combination.destination}: ${searchResult.error}`);
        }
      }
    }

    // Remove duplicate flights based on flight key (combination of airline, flight number, departure time)
    const uniqueFlights = allFlights.filter((flight, index, self) => {
      const flightKey = flight.itineraries?.map((itinerary: any) => 
        itinerary.segments?.map((segment: any) => 
          `${segment.carrierCode}${segment.number}_${segment.departure?.at}`
        ).join('|')
      ).join('||');
      
      return index === self.findIndex(f => {
        const fKey = f.itineraries?.map((itinerary: any) => 
          itinerary.segments?.map((segment: any) => 
            `${segment.carrierCode}${segment.number}_${segment.departure?.at}`
          ).join('|')
        ).join('||');
        return fKey === flightKey;
      });
    });

    console.log(`🎯 Total unique flights found: ${uniqueFlights.length} from ${allFlights.length} total results across ${searchedRoutes.length} successful routes`);
    if (failedRoutes.length > 0) {
      console.log(`⚠️ Failed routes: ${failedRoutes.join(', ')}`);
    }
    
    // Log search to database
    try {
      await db.insert(flightSearches).values({
        origins: JSON.stringify(searchParams.origins),
        destinations: JSON.stringify(searchParams.destinations),
        departureDate: departureDate,
        returnDate: returnDate,
        departureFlex: searchParams.departureFlex,
        returnFlex: searchParams.returnFlex,
        autoRecommendStopovers: searchParams.autoRecommendStopovers,
        includeNeighboringCountries: searchParams.includeNeighboringCountries,
        resultCount: uniqueFlights.length
      });
      console.log('Flight search logged to database');
    } catch (dbError) {
      console.error('Error logging search to database:', dbError);
      // Don't fail the request if database logging fails
    }
    
    // Log sample of the returned data for debugging
    if (uniqueFlights.length > 0) {
      console.log('Sample flight data structure:', JSON.stringify(uniqueFlights[0], null, 2));
      console.log('Available dictionaries:', Object.keys(combinedDictionaries));
    } else {
      console.log('No flight data returned from any route.');
    }

    res.json({
      success: true,
      searchParams,
      flights: uniqueFlights,
      meta: combinedMeta,
      dictionaries: combinedDictionaries,
      searchInfo: {
        searchedRoutes: searchedRoutes,
        failedRoutes: failedRoutes,
        searchDate: departureDate,
        returnDate: returnDate,
        totalResults: uniqueFlights.length,
        totalRawResults: allFlights.length,
        routesCombinations: searchCombinations.length
      }
    });

  } catch (error) {
    console.error('Error in search-flights function:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;