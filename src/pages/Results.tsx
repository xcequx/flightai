import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ParetoTabs } from "@/components/results/ParetoTabs";
import { SearchProgress } from "@/components/results/SearchProgress";
import { ArrowLeft, RefreshCw } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<typeof mockResults>([]);

  useEffect(() => {
    // Simulate loading process
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
  }, []);

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

      <main className="container mx-auto px-4 py-8">
        <ParetoTabs results={results} />
      </main>
    </div>
  );
}