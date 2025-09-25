import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ParetoTabs } from "@/components/results/ParetoTabs";
import { SearchProgress } from "@/components/results/SearchProgress";
import { StopoverRecommendations } from "@/components/results/StopoverRecommendations";
import { ArrowLeft, RefreshCw, Info } from "lucide-react";

// Mock stopover recommendations
const mockRecommendations = [
  {
    hub: "Dubai",
    hubCode: "DXB",
    country: "United Arab Emirates",
    minDays: 2,
    maxDays: 5,
    savings: 450,
    savingsPercent: 25,
    totalPrice: 1350,
    originalPrice: 1800,
    popularRoutes: ["Emirates", "flydubai", "Air Arabia"]
  },
  {
    hub: "Istanbul",
    hubCode: "IST",
    country: "Turkey",
    minDays: 2,
    maxDays: 4,
    savings: 380,
    savingsPercent: 22,
    totalPrice: 1420,
    originalPrice: 1800,
    popularRoutes: ["Turkish Airlines", "Pegasus"]
  }
];

// Enhanced mock results data with realistic diversity
const mockResults = [
  {
    id: "1",
    price: 1180,
    totalHours: 14,
    riskScore: 0.1,
    segments: [
      { from: "WAW", to: "BKK", departure: "2024-03-15T23:30", arrival: "2024-03-16T16:45", carrier: "LOT Polish Airlines", flight: "LO625" }
    ],
    stopovers: [],
    selfTransfer: false,
    aiRecommended: true,
    aiInsights: {
      recommendation: "Best value direct flight",
      reasoning: "Shortest travel time with competitive pricing",
      confidence: 0.92,
      highlights: ["Direct flight", "Good timing", "Reliable airline"]
    }
  },
  {
    id: "2",
    price: 950,
    totalHours: 26,
    riskScore: 0.2,
    segments: [
      { from: "WAW", to: "DXB", departure: "2024-03-15T10:30", arrival: "2024-03-15T18:45", carrier: "Emirates", flight: "EK183" },
      { from: "DXB", to: "BKK", departure: "2024-03-18T02:15", arrival: "2024-03-18T12:30", carrier: "Thai Airways", flight: "TG317" }
    ],
    stopovers: [{ city: "Dubai", days: 3 }],
    selfTransfer: false,
    aiRecommended: true,
    aiInsights: {
      recommendation: "Great savings with Dubai stopover",
      reasoning: "Significant cost savings plus explore Dubai",
      confidence: 0.89,
      highlights: ["25% cheaper", "3-day Dubai experience", "Top airlines"]
    }
  },
  {
    id: "3",
    price: 1050,
    totalHours: 22,
    riskScore: 0.15,
    segments: [
      { from: "WAW", to: "DOH", departure: "2024-03-15T14:20", arrival: "2024-03-15T22:35", carrier: "Qatar Airways", flight: "QR201" },
      { from: "DOH", to: "BKK", departure: "2024-03-17T08:40", arrival: "2024-03-17T19:15", carrier: "Qatar Airways", flight: "QR837" }
    ],
    stopovers: [{ city: "Doha", days: 2 }],
    selfTransfer: false,
    aiRecommended: false
  },
  {
    id: "4",
    price: 1320,
    totalHours: 18,
    riskScore: 0.05,
    segments: [
      { from: "WAW", to: "FRA", departure: "2024-03-15T06:15", arrival: "2024-03-15T08:30", carrier: "Lufthansa", flight: "LH1346" },
      { from: "FRA", to: "BKK", departure: "2024-03-15T13:45", arrival: "2024-03-16T07:30", carrier: "Lufthansa", flight: "LH772" }
    ],
    stopovers: [],
    selfTransfer: false,
    aiRecommended: false
  },
  {
    id: "5",
    price: 890,
    totalHours: 28,
    riskScore: 0.25,
    segments: [
      { from: "WAW", to: "IST", departure: "2024-03-15T16:45", arrival: "2024-03-15T20:30", carrier: "Turkish Airlines", flight: "TK1766" },
      { from: "IST", to: "BKK", departure: "2024-03-18T01:40", arrival: "2024-03-18T14:15", carrier: "Turkish Airlines", flight: "TK69" }
    ],
    stopovers: [{ city: "Istanbul", days: 3 }],
    selfTransfer: false,
    aiRecommended: true,
    aiInsights: {
      recommendation: "Best value with cultural experience",
      reasoning: "Lowest price with authentic Turkish culture experience",
      confidence: 0.85,
      highlights: ["Cheapest option", "Explore Istanbul", "Excellent cuisine"]
    }
  },
  {
    id: "6",
    price: 1420,
    totalHours: 16,
    riskScore: 0.08,
    segments: [
      { from: "WAW", to: "MUC", departure: "2024-03-15T08:25", arrival: "2024-03-15T10:15", carrier: "Lufthansa", flight: "LH1624" },
      { from: "MUC", to: "BKK", departure: "2024-03-15T21:30", arrival: "2024-03-16T15:25", carrier: "Lufthansa", flight: "LH772" }
    ],
    stopovers: [],
    selfTransfer: false,
    aiRecommended: false
  },
  {
    id: "7",
    price: 1150,
    totalHours: 24,
    riskScore: 0.18,
    segments: [
      { from: "WAW", to: "AMS", departure: "2024-03-15T11:30", arrival: "2024-03-15T13:20", carrier: "KLM", flight: "KL1364" },
      { from: "AMS", to: "BKK", departure: "2024-03-15T22:35", arrival: "2024-03-16T16:40", carrier: "KLM", flight: "KL875" }
    ],
    stopovers: [],
    selfTransfer: false,
    aiRecommended: false
  },
  {
    id: "8",
    price: 980,
    totalHours: 30,
    riskScore: 0.22,
    segments: [
      { from: "WAW", to: "CDG", departure: "2024-03-15T07:40", arrival: "2024-03-15T09:55", carrier: "Air France", flight: "AF1248" },
      { from: "CDG", to: "SIN", departure: "2024-03-15T23:25", arrival: "2024-03-16T18:50", carrier: "Singapore Airlines", flight: "SQ336" },
      { from: "SIN", to: "BKK", departure: "2024-03-17T14:30", arrival: "2024-03-17T15:45", carrier: "Singapore Airlines", flight: "SQ711" }
    ],
    stopovers: [{ city: "Singapore", days: 1 }],
    selfTransfer: false,
    aiRecommended: false
  }
];

// Helper function to generate badges dynamically based on current language
const generateBadges = (flight: any, t: any): string[] => {
  const badges: string[] = [];
  const segments = flight.segments || [];
  const isAviationstackFormat = flight.dataSource === 'aviationstack';
  const isMultiLeg = flight.multiLeg || false;
  
  // Layover badges with proper pluralization
  if (segments.length > 1) {
    const layoverCount = segments.length - 1;
    if (layoverCount === 1) {
      badges.push(t('results.badge.layovers_one', { count: layoverCount }));
    } else if (layoverCount >= 2 && layoverCount <= 4) {
      badges.push(t('results.badge.layovers_few', { count: layoverCount }));
    } else {
      badges.push(t('results.badge.layovers_many', { count: layoverCount }));
    }
  } else {
    badges.push(t('results.badge.direct'));
  }
  
  // Real-time data badge
  if (isAviationstackFormat) {
    badges.push(t('results.badge.realTimeData'));
  }
  
  // Standard fare badge
  if (flight.rawData?.travelerPricings?.[0]?.fareOption === 'STANDARD') {
    badges.push(t('results.badge.standardFare'));
  }
  
  // Multi-leg flight badges
  if (isMultiLeg && flight.stopoverInfo) {
    badges.push(t('results.badge.stopoverDays', {
      days: flight.stopoverInfo.layoverDays,
      city: flight.stopoverInfo.hub.city
    }));
    if (flight.stopoverInfo.savings > 0) {
      badges.push(t('results.badge.savingsPercent', {
        percent: flight.stopoverInfo.savingsPercent
      }));
    }
  }
  
  return badges;
};

export default function Results() {
  const { searchId } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get search data from navigation state with enhanced metadata
  const searchData = location.state?.realFlightData;
  const dataSource = location.state?.dataSource || 'mock';
  const apiKeyRequired = location.state?.apiKeyRequired;
  const hasError = location.state?.hasError;
  const apiWarning = location.state?.apiWarning;
  const searchMeta = location.state?.searchMeta;

  useEffect(() => {
    if (searchData && searchData.flights && Array.isArray(searchData.flights)) {
      // Convert Aviationstack/Amadeus API data to our format
      const convertedResults = searchData.flights.map((flight: any, index: number) => {
        // Handle both Aviationstack and legacy Amadeus format
        const isAviationstackFormat = flight.source === 'aviationstack';
        const segmentsData = flight.itineraries?.[0]?.segments || [];
        const segments = Array.isArray(segmentsData) ? segmentsData.map((segment: any) => ({
          from: segment.departure.iataCode,
          to: segment.arrival.iataCode,
          departure: segment.departure.at,
          arrival: segment.arrival.at,
          carrier: searchData.dictionaries?.carriers?.[segment.carrierCode] || segment.carrierCode,
          flight: `${segment.carrierCode}${segment.number}`,
          duration: segment.duration,
          terminal: segment.departure.terminal
        })) : [];

        // Calculate total duration
        const totalDuration = flight.itineraries?.[0]?.duration;
        const hours = totalDuration ? parseInt(totalDuration.replace('PT', '').replace('H', '').split('M')[0]) : 0;
        const minutes = totalDuration ? parseInt(totalDuration.split('H')[1]?.replace('M', '') || '0') : 0;
        const totalHours = hours + Math.round(minutes / 60);

        // Store metadata for dynamic badge generation (no hardcoded strings)
        const isMultiLeg = flight.multiLeg || false;

        // Calculate stopovers for multi-leg flights
        let stopovers: Array<{ city: string; days: number }> = [];
        if (isMultiLeg && flight.stopoverInfo) {
          stopovers = [{
            city: flight.stopoverInfo.hub.city,
            days: flight.stopoverInfo.layoverDays
          }];
        } else if (segments.length > 1) {
          stopovers = [{ city: segments[0].to, days: 0 }];
        }

        return {
          id: flight.id || `flight-${index}`,
          price: parseFloat(flight.price?.total || '0'),
          totalHours,
          riskScore: segments.length > 2 ? 0.3 : segments.length > 1 ? 0.2 : 0.1,
          segments,
          stopovers,
          selfTransfer: false,
          rawData: flight, // Store original API data
          dataSource: isAviationstackFormat ? 'aviationstack' : 'amadeus',
          multiLeg: isMultiLeg,
          stopoverInfo: flight.stopoverInfo || undefined
        };
      });

      setResults(convertedResults);
      setIsLoading(false);
      
      // Log data source for debugging
      console.log(`📊 Displaying ${convertedResults.length} flights from ${dataSource} source`);
      if (searchMeta) {
        console.log('🔍 Search metadata:', searchMeta);
      }
    } else {
      // Faster, more responsive search simulation
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsLoading(false);
            
            // Enhanced mock results with proper metadata
            const enhancedMockResults = mockResults.map((result, index) => ({
              ...result,
              dataSource: 'mock'
            }));
            
            setResults(enhancedMockResults);
            console.log('✈️ Displaying demo flight options with realistic pricing and routes');
            return 100;
          }
          return prev + Math.random() * 20 + 8; // Faster progress for better UX
        });
      }, 200); // Faster updates for more responsive feel

      return () => clearInterval(interval);
    }
  }, [searchData, dataSource, searchMeta]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{t('results.errorTitle')}</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>
            {t('results.backToSearch')}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('results.backToSearch')}
              </Button>
              <h1 className="text-xl font-semibold">
                {t('search.title')} #{searchId?.slice(-6)}
              </h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <SearchProgress progress={progress} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('results.backToSearch')}
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  {t('results.title')}
                </h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{t('search.foundResults', { count: results.length })}</span>
                  {dataSource === 'aviationstack' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                      ✈️ {t('results.realTimeData')} (Aviationstack)
                    </span>
                  )}
                  {dataSource === 'mock' && !apiKeyRequired && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-info/10 text-info rounded-full text-xs font-medium">
                      ✈️ {t('results.demoResults') || 'Demo Results'}
                    </span>
                  )}
                  {apiKeyRequired && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-info/10 text-info rounded-full text-xs font-medium">
                      🔑 {t('results.apiKeyRequired')}
                    </span>
                  )}
                </div>
                {apiWarning && (
                  <p className="text-xs text-warning mt-1">⚠️ {apiWarning}</p>
                )}
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('results.refreshSearch')}
            </Button>
          </div>
          
          {/* API Key Setup Banner */}
          {apiKeyRequired && (
            <div className="mt-4 p-4 bg-gradient-to-r from-info/10 to-primary/10 border border-info/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-info/10 p-2 rounded-full">
                  <Info className="h-5 w-5 text-info" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-2">
                    🔑 {t('results.setupInstructions')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('results.apiKeyRequired')}. 
                    {t('results.mockDataWhileSetup')}.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">📋 {t('results.instructionsConfig')}:</span>
                        <ol className="list-decimal list-inside mt-1 space-y-1 text-xs text-muted-foreground">
                          <li>{t('results.aviationstackSignup')} <a href="https://aviationstack.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">aviationstack.com</a></li>
                          <li>{t('results.getApiKey')}</li>
                          <li>{t('results.addToSecrets')}</li>
                          <li>{t('results.restartWorkflow')}</li>
                        </ol>
                      </div>
                      <div>
                        <span className="font-medium">✨ {t('results.realDataBenefits')}:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-xs text-muted-foreground">
                          <li>{t('results.realTimeAccess')}</li>
                          <li>{t('results.moreRoutes')}</li>
                          <li>{t('results.accuratePrices')}</li>
                          <li>{t('results.saveTime')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <StopoverRecommendations 
          recommendations={mockRecommendations}
          route="Europa → Azja"
        />
        <ParetoTabs 
          results={results.map(result => ({
            ...result,
            badges: generateBadges(result, t)
          }))} 
        />
      </main>
    </div>
  );
}