import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ParetoTabs } from "@/components/results/ParetoTabs";
import { SearchProgress } from "@/components/results/SearchProgress";
import { StopoverRecommendations } from "@/components/results/StopoverRecommendations";
import { ArrowLeft, RefreshCw, Info } from "lucide-react";

// Mock stopover recommendations
const mockRecommendations = [
  {
    hub: "Dubaj",
    hubCode: "DXB",
    country: "Zjednoczone Emiraty Arabskie",
    minDays: 2,
    maxDays: 5,
    savings: 450,
    savingsPercent: 25,
    totalPrice: 1350,
    originalPrice: 1800,
    popularRoutes: ["Emirates", "flydubai", "Air Arabia"]
  },
  {
    hub: "Stambuł",
    hubCode: "IST",
    country: "Turcja",
    minDays: 2,
    maxDays: 4,
    savings: 380,
    savingsPercent: 22,
    totalPrice: 1420,
    originalPrice: 1800,
    popularRoutes: ["Turkish Airlines", "Pegasus"]
  }
];

// Mock results data
const mockResults = [
  {
    id: "1",
    price: 1250,
    totalHours: 28,
    riskScore: 0.2,
    segments: [
      { from: "WAW", to: "DXB", departure: "2024-03-15T10:30", arrival: "2024-03-15T18:45", carrier: "Emirates", flight: "EK183" },
      { from: "DXB", to: "BKK", departure: "2024-03-18T02:15", arrival: "2024-03-18T12:30", carrier: "Thai Airways", flight: "TG317" }
    ],
    stopovers: [{ city: "Dubai", days: 3 }],
    selfTransfer: true,
    badges: ["Self-Transfer", "3-day Stopover"]
  },
  {
    id: "2", 
    price: 1450,
    totalHours: 22,
    riskScore: 0.1,
    segments: [
      { from: "WAW", to: "DOH", departure: "2024-03-15T14:20", arrival: "2024-03-15T22:35", carrier: "Qatar Airways", flight: "QR201" },
      { from: "DOH", to: "BKK", departure: "2024-03-17T08:40", arrival: "2024-03-17T19:15", carrier: "Qatar Airways", flight: "QR837" }
    ],
    stopovers: [{ city: "Doha", days: 2 }],
    selfTransfer: false,
    badges: ["2-day Stopover"]
  }
];

export default function Results() {
  const { searchId } = useParams();
  const location = useLocation();
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
    if (searchData && searchData.flights) {
      // Convert Aviationstack/Amadeus API data to our format
      const convertedResults = searchData.flights.map((flight: any, index: number) => {
        // Handle both Aviationstack and legacy Amadeus format
        const isAviationstackFormat = flight.source === 'aviationstack';
        const segments = flight.itineraries[0].segments.map((segment: any) => ({
          from: segment.departure.iataCode,
          to: segment.arrival.iataCode,
          departure: segment.departure.at,
          arrival: segment.arrival.at,
          carrier: searchData.dictionaries?.carriers?.[segment.carrierCode] || segment.carrierCode,
          flight: `${segment.carrierCode}${segment.number}`,
          duration: segment.duration,
          terminal: segment.departure.terminal
        }));

        // Calculate total duration
        const totalDuration = flight.itineraries[0].duration;
        const hours = totalDuration ? parseInt(totalDuration.replace('PT', '').replace('H', '').split('M')[0]) : 0;
        const minutes = totalDuration ? parseInt(totalDuration.split('H')[1]?.replace('M', '') || '0') : 0;
        const totalHours = hours + Math.round(minutes / 60);

        // Enhanced badges based on data source and flight characteristics
        const badges: string[] = [];
        if (segments.length > 1) {
          badges.push(`${segments.length - 1} przesiadka${segments.length > 2 ? 'i' : ''}`);
        } else {
          badges.push('Bezpośredni');
        }
        
        if (isAviationstackFormat) {
          badges.push('Real-time data');
        }
        
        if (flight.travelerPricings?.[0]?.fareOption === 'STANDARD') {
          badges.push('Standard fare');
        }

        // Handle multi-leg flight data
        const isMultiLeg = flight.multiLeg || false;
        
        // Enhanced badges for multi-leg flights
        if (isMultiLeg && flight.stopoverInfo) {
          badges.push(`${flight.stopoverInfo.layoverDays}-dniowy pobyt w ${flight.stopoverInfo.hub.city}`);
          if (flight.stopoverInfo.savings > 0) {
            badges.push(`Oszczędność ${flight.stopoverInfo.savingsPercent}%`);
          }
        }

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
          badges,
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
      // Fallback to mock data with proper progress animation
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsLoading(false);
            
            // Enhanced mock results with proper metadata
            const enhancedMockResults = mockResults.map((result, index) => ({
              ...result,
              dataSource: 'mock',
              badges: [...result.badges, 'Przykładowe dane']
            }));
            
            setResults(enhancedMockResults);
            console.log('🎭 Using mock data due to API unavailability');
            return 100;
          }
          return prev + Math.random() * 15 + 5; // Variable progress for realism
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [searchData, dataSource, searchMeta]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Wystąpił błąd</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>
            Wróć do wyszukiwania
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
                Wróć do wyszukiwania
              </Button>
              <h1 className="text-xl font-semibold">
                Wyszukiwanie #{searchId?.slice(-6)}
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
                Nowe wyszukiwanie
              </Button>
              <div>
                <h1 className="text-xl font-semibold">
                  Wyniki wyszukiwania
                </h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Znaleziono {results.length} opcji podróży</span>
                  {dataSource === 'aviationstack' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                      ✈️ Dane rzeczywiste (Aviationstack)
                    </span>
                  )}
                  {dataSource === 'mock' && !apiKeyRequired && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                      🎭 Dane przykładowe
                    </span>
                  )}
                  {apiKeyRequired && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-info/10 text-info rounded-full text-xs font-medium">
                      🔑 Wymagany klucz API
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
              Odśwież wyniki
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
                    🔑 Skonfiguruj klucz API dla prawdziwych danych lotów
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Aby korzystać z rzeczywistych danych lotów z Aviationstack, potrzebujesz klucza API. 
                    W międzyczasie pokazujemy przykładowe dane.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">📋 Instrukcje konfiguracji:</span>
                        <ol className="list-decimal list-inside mt-1 space-y-1 text-xs text-muted-foreground">
                          <li>Zarejestruj się na <a href="https://aviationstack.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">aviationstack.com</a></li>
                          <li>Otrzymaj darmowy klucz API</li>
                          <li>Dodaj go jako zmienną środowiskową: AVIATIONSTACK_API_KEY</li>
                          <li>Uruchom aplikację ponownie</li>
                        </ol>
                      </div>
                      <div>
                        <span className="font-medium">✨ Korzyści z prawdziwych danych:</span>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-xs text-muted-foreground">
                          <li>Aktualne ceny i rozkłady lotów</li>
                          <li>Rzeczywiste trasy i przesiadki</li>
                          <li>Informacje o terminalach i bramkach</li>
                          <li>Status lotów w czasie rzeczywistym</li>
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
        <ParetoTabs results={results} />
      </main>
    </div>
  );
}