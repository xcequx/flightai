import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AirportMultiSelect } from "./AirportMultiSelect";
import { StopoverEditor } from "./StopoverEditor";
import { ConstraintSliders } from "./ConstraintSliders";
import { Search } from "lucide-react";

interface SearchBuilderProps {
  onSearch: (params: any) => void;
  isLoading?: boolean;
}

export interface SearchParams {
  origins: string[];
  destinations: string[];
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
}

export function SearchBuilder({ onSearch, isLoading = false }: SearchBuilderProps) {
  const [params, setParams] = useState<SearchParams>({
    origins: [],
    destinations: [],
    stopovers: [],
    preferences: { price: 60, time: 25, risk: 15 },
    constraints: {
      maxTotalHours: 48,
      allowSelfTransfer: true,
      allowPositioningFlights: false,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(params);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Origin & Destination */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Skąd lecisz?
          </label>
          <AirportMultiSelect
            value={params.origins}
            onChange={(origins) => setParams({ ...params, origins })}
            placeholder="Warszawa, Kraków..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Dokąd lecisz?
          </label>
          <AirportMultiSelect
            value={params.destinations}
            onChange={(destinations) => setParams({ ...params, destinations })}
            placeholder="Bangkok, Tokio..."
          />
        </div>
      </div>

      {/* Stopovers */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Przesiadki (2-6 dni)
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
            disabled={isLoading || params.origins.length === 0 || params.destinations.length === 0}
            className="h-14 text-lg bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
          >
            {isLoading ? (
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