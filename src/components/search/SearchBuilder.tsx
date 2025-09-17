import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AirportMultiSelect } from "./AirportMultiSelect";
import { CountrySelect } from "./CountrySelect";
import { StopoverEditor } from "./StopoverEditor";
import { ConstraintSliders } from "./ConstraintSliders";
import { DateRangePicker } from "./DateRangePicker";
import { DateFlexibility } from "./DateFlexibility";
import { Search, Lightbulb, TrendingDown, DollarSign, MapPin, Info } from "lucide-react";
import { DateRange } from "react-day-picker";

interface SearchBuilderProps {
  onSearch: (params: any) => void;
  isLoading?: boolean;
}

export interface SearchParams {
  origins: string[];
  destinations: string[];
  dateRange: DateRange | undefined;
  departureFlex: number;
  returnFlex: number;
  stopovers: Array<{
    location: string;
    minDays: number;
    maxDays: number;
    mandatory: boolean;
  }>;
  preferences: {
    price: number;
    time: number;
    risk: number;
  };
  constraints: {
    maxTotalHours: number;
    allowSelfTransfer: boolean;
    allowPositioningFlights: boolean;
  };
  autoRecommendStopovers: boolean;
  includeNeighboringCountries: boolean;
}

export function SearchBuilder({ onSearch, isLoading = false }: SearchBuilderProps) {
  const [params, setParams] = useState<SearchParams>({
    origins: [],
    destinations: [],
    dateRange: undefined,
    departureFlex: 3,
    returnFlex: 3,
    stopovers: [],
    preferences: { price: 60, time: 25, risk: 15 },
    constraints: {
      maxTotalHours: 48,
      allowSelfTransfer: true,
      allowPositioningFlights: false,
    },
    autoRecommendStopovers: true,
    includeNeighboringCountries: false,
  });
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLocalLoading(true);
      
      // Call our Express API for flight search
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Real flight data:', data);
        // Pass the real data to the parent component
        onSearch({ ...params, realFlightData: data });
      } else {
        console.error('Flight search error:', data.error);
        // For now, fall back to mock data
        onSearch(params);
      }
    } catch (error) {
      console.error('Error calling flight search:', error);
      // Fall back to mock data
      onSearch(params);
    } finally {
      setLocalLoading(false);
    }
  };

  const currentLoading = isLoading || localLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Smart Travel Tips Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <TrendingDown className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Inteligentne oszczędzanie na lotach
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Dzięki wyszukiwaniu w krajach sąsiadujących możesz zaoszczędzić nawet <span className="font-bold text-success">1000+ złotych</span> na bilecie lotniczym!
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-background/50 p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Przykład trasy</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="text-success font-medium">✈️ Berlin → Bangkok: 2100 zł</div>
                  <div className="text-muted-foreground">vs Warszawa → Bangkok: 3200 zł</div>
                  <div className="text-success font-bold">Oszczędność: 1100 zł!</div>
                </div>
              </div>
              
              <div className="bg-background/50 p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-info" />
                  <span className="font-medium text-sm">Jak to działa</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>• Rozszerzamy wyszukiwanie na sąsiednie kraje</div>
                  <div>• Często znajdziesz tam tańsze loty</div>
                  <div>• Pokazujemy różne opcje do porównania</div>
                </div>
              </div>
              
              <div className="bg-background/50 p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  <span className="font-medium text-sm">Rada eksperta</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>Sprawdź opcje z Berlina, Pragi</div>
                  <div>czy Bratysławy - często są</div>
                  <div className="text-success font-medium">znacznie tańsze!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Origin & Destination */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Skąd lecisz?
            </label>
            <AirportMultiSelect
              value={params.origins}
              onChange={(origins) => setParams({ ...params, origins })}
              placeholder="Polska, Warszawa, Europa..."
            />
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg border-l-4 border-l-primary/50">
            <Checkbox
              id="includeNeighbors"
              checked={params.includeNeighboringCountries}
              onCheckedChange={(checked) => 
                setParams({ ...params, includeNeighboringCountries: !!checked })
              }
              className="mt-0.5"
              data-testid="checkbox-include-neighbors"
            />
            <div className="flex-1">
              <label htmlFor="includeNeighbors" className="text-sm font-medium text-foreground cursor-pointer">
                Uwzględnij kraje sąsiednie w wyszukiwaniu
              </label>
              <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-primary">Znajdziemy najtańsze opcje</span> także z lotnisk w krajach sąsiadujących. 
                  To może znacznie obniżyć cenę podróży!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center gap-2 px-2 py-1 bg-success/10 rounded">
                    <span className="text-success font-medium">Przykład:</span>
                    <span>Berlin→Bangkok od 2100 zł</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded">
                    <span className="text-muted-foreground">vs</span>
                    <span>Warszawa→Bangkok od 3200 zł</span>
                  </div>
                </div>
                <p className="mt-2">
                  <span className="font-medium">Rozszerzamy wyszukiwanie na:</span> Niemcy, Czechy, Słowację, Litwę 
                  i inne sąsiednie kraje. Często znajdziesz tam znacznie tańsze opcje lotów.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Dokąd lecisz?
          </label>
          <AirportMultiSelect
            value={params.destinations}
            onChange={(destinations) => setParams({ ...params, destinations })}
            placeholder="Bangkok, Tokio, Azja..."
          />
        </div>
      </div>

      {/* Date Range & Flexibility */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Kiedy chcesz lecieć?
          </label>
          <DateRangePicker
            dateRange={params.dateRange}
            onChange={(dateRange) => setParams({ ...params, dateRange })}
            placeholder="Wybierz zakres dat podróży"
          />
        </div>
        
        <DateFlexibility
          departureFlex={params.departureFlex}
          returnFlex={params.returnFlex}
          onDepartureFlexChange={(departureFlex) => setParams({ ...params, departureFlex })}
          onReturnFlexChange={(returnFlex) => setParams({ ...params, returnFlex })}
        />
      </div>

      {/* Auto-recommend Stopovers */}
      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg border">
        <Lightbulb className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoRecommend"
              checked={params.autoRecommendStopovers}
              onCheckedChange={(checked) => 
                setParams({ ...params, autoRecommendStopovers: !!checked })
              }
            />
            <label htmlFor="autoRecommend" className="text-sm font-medium">
              Automatycznie sugeruj przesiadki obniżające cenę
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Znajdziemy najlepsze opcje przesiadek w Dubaju, Turcji i innych hubbach, które mogą znacznie obniżyć koszt podróży
          </p>
        </div>
      </div>

      {/* Manual Stopovers */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Własne przesiadki (opcjonalnie)
        </label>
        <StopoverEditor
          stopovers={params.stopovers}
          onChange={(stopovers) => setParams({ ...params, stopovers })}
        />
      </div>

      {/* Preferences & Constraints */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h4 className="font-medium mb-4">Preferencje</h4>
          <ConstraintSliders
            preferences={params.preferences}
            constraints={params.constraints}
            onPreferencesChange={(preferences) => 
              setParams({ ...params, preferences })
            }
            onConstraintsChange={(constraints) => 
              setParams({ ...params, constraints })
            }
          />
        </Card>
        
        <div className="flex flex-col justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={currentLoading || params.origins.length === 0 || params.destinations.length === 0 || !params.dateRange?.from}
            className="h-14 text-lg bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
          >
            {currentLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Wyszukuję...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Znajdź loty
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}