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
import { Search, Lightbulb } from "lucide-react";
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
          
          <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
            <Checkbox
              id="includeNeighbors"
              checked={params.includeNeighboringCountries}
              onCheckedChange={(checked) => 
                setParams({ ...params, includeNeighboringCountries: !!checked })
              }
            />
            <label htmlFor="includeNeighbors" className="text-sm font-medium">
              Uwzględnij kraje sąsiednie
            </label>
            <div className="text-xs text-muted-foreground">
              (może być taniej z Berlina niż z Warszawy)
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