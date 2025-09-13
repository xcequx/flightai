import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ParetoTabs } from "@/components/results/ParetoTabs";
import { SearchProgress } from "@/components/results/SearchProgress";
import { StopoverRecommendations } from "@/components/results/StopoverRecommendations";
import { ArrowLeft, RefreshCw } from "lucide-react";

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

  // Get search data from navigation state
  const searchData = location.state?.realFlightData;

  useEffect(() => {
    if (searchData && searchData.flights) {
      // Convert Amadeus API data to our format
      const convertedResults = searchData.flights.map((flight: any, index: number) => {
        const segments = flight.itineraries[0].segments.map((segment: any) => ({
          from: segment.departure.iataCode,
          to: segment.arrival.iataCode,
          departure: segment.departure.at,
          arrival: segment.arrival.at,
          carrier: searchData.dictionaries?.carriers?.[segment.carrierCode] || segment.carrierCode,
          flight: `${segment.carrierCode}${segment.number}`,
          duration: segment.duration
        }));

        // Calculate total duration
        const totalDuration = flight.itineraries[0].duration;
        const hours = totalDuration ? parseInt(totalDuration.replace('PT', '').replace('H', '').split('M')[0]) : 0;
        const minutes = totalDuration ? parseInt(totalDuration.split('H')[1]?.replace('M', '') || '0') : 0;
        const totalHours = hours + Math.round(minutes / 60);

        return {
          id: flight.id || `flight-${index}`,
          price: parseFloat(flight.price?.total || '0'),
          totalHours,
          riskScore: segments.length > 2 ? 0.3 : 0.1, // Higher risk for more connections
          segments,
          stopovers: segments.length > 1 ? [{ city: segments[0].to, days: 0 }] : [],
          selfTransfer: false,
          badges: segments.length > 1 ? [`${segments.length - 1} przesiadka`] : ['Bezpośredni'],
          rawData: flight // Store original API data
        };
      });

      setResults(convertedResults);
      setIsLoading(false);
    } else {
      // Fallback to mock data if no real data
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsLoading(false);
            setResults(mockResults);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [searchData]);

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
                <p className="text-sm text-muted-foreground">
                  Znaleziono {results.length} opcji podróży
                </p>
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Odśwież wyniki
            </Button>
          </div>
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