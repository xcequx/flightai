import fetch from 'node-fetch';

// Helper function to convert ISO date strings or Date objects to YYYY-MM-DD format
const formatDateForAPI = (dateInput) => {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateInput);
    // Fallback to original string if it's already in YYYY-MM-DD format
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    throw new Error(`Invalid date format: ${dateInput}`);
  }
};

class AmadeusAPI {
  constructor() {
    this.clientId = process.env.AMADEUS_CLIENT_ID;
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    // Use test environment for test credentials
    this.baseUrl = 'https://test.api.amadeus.com';
    this.token = null;
    this.tokenExpiry = null;
  }

  // OAuth2 token management
  async getAccessToken() {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      return this.token;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Amadeus API credentials not found. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.');
    }

    try {
      console.log('🔑 Requesting new Amadeus access token...');
      
      const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Amadeus OAuth error:', response.status, errorText);
        throw new Error(`Amadeus OAuth failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      this.token = data.access_token;
      // Set expiry with a 1-minute buffer
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
      
      console.log('✅ Amadeus access token obtained successfully');
      return this.token;
    } catch (error) {
      console.error('❌ Failed to get Amadeus access token:', error);
      throw error;
    }
  }

  // Search flight offers
  async searchFlightOffers(searchParams) {
    const token = await this.getAccessToken();
    
    // Convert our internal search params to Amadeus API format
    const amadeusParams = this.convertToAmadeusParams(searchParams);
    
    try {
      console.log('🔍 Searching Amadeus flight offers with params:', JSON.stringify(amadeusParams, null, 2));
      
      const url = new URL(`${this.baseUrl}/v2/shopping/flight-offers`);
      Object.entries(amadeusParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Amadeus flight search error:', response.status, errorText);
        
        // Try to parse error details
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(`Amadeus API error: ${errorData.error_description || errorData.detail || errorText}`);
        } catch {
          throw new Error(`Amadeus API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      console.log(`✅ Amadeus search successful: ${data.data?.length || 0} flight offers found`);
      return data;
    } catch (error) {
      console.error('❌ Amadeus flight search failed:', error);
      throw error;
    }
  }

  // Convert our search parameters to Amadeus API format
  convertToAmadeusParams(searchParams) {
    const params = {};
    
    // Origins and destinations - Amadeus expects single origin/destination for basic search
    if (searchParams.origins?.length > 0) {
      params.originLocationCode = searchParams.origins[0];
    }
    
    if (searchParams.destinations?.length > 0) {
      params.destinationLocationCode = searchParams.destinations[0];
    }

    // Departure date (required) - CRITICAL FIX: Apply date formatting
    if (searchParams.dateRange?.from) {
      params.departureDate = formatDateForAPI(searchParams.dateRange.from);
      console.log(`✅ Formatted departure date: ${searchParams.dateRange.from} → ${params.departureDate}`);
    }

    // Return date (optional) - CRITICAL FIX: Apply date formatting
    if (searchParams.dateRange?.to) {
      params.returnDate = formatDateForAPI(searchParams.dateRange.to);
      console.log(`✅ Formatted return date: ${searchParams.dateRange.to} → ${params.returnDate}`);
    }

    // Number of adults (default to 1)
    params.adults = 1;

    // Travel class (default to ECONOMY)
    params.travelClass = searchParams.travelClass || 'ECONOMY';

    // Currency
    params.currencyCode = 'PLN';

    // Maximum results
    params.max = Math.min(searchParams.maxResults || 50, 250); // Amadeus limit is 250

    // Non-stop flights preference
    if (searchParams.nonStop !== undefined) {
      params.nonStop = searchParams.nonStop;
    }

    return params;
  }

  // Get flight price analysis
  async getFlightPriceAnalysis(params) {
    const token = await this.getAccessToken();
    
    try {
      const url = new URL(`${this.baseUrl}/v1/analytics/itinerary-price-metrics`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('⚠️ Price analysis unavailable:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn('⚠️ Price analysis failed:', error.message);
      return null;
    }
  }

  // Search airports by keyword
  async searchAirports(keyword) {
    const token = await this.getAccessToken();
    
    try {
      const url = new URL(`${this.baseUrl}/v1/reference-data/locations`);
      url.searchParams.append('keyword', keyword);
      url.searchParams.append('subType', 'AIRPORT');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Airport search failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Airport search failed:', error);
      throw error;
    }
  }

  // Hotel search (preparation for future implementation)
  async searchHotels(params) {
    const token = await this.getAccessToken();
    
    try {
      const url = new URL(`${this.baseUrl}/v3/shopping/hotel-offers`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hotel search failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Hotel search failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const amadeus = new AmadeusAPI();

export default amadeus;