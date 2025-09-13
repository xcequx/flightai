import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AirportMultiSelect } from "./AirportMultiSelect";
import { Plus, Trash2, MapPin } from "lucide-react";

interface Stopover {
  id: string;
  location: string;
  minDays: number;
  maxDays: number;
  mandatory: boolean;
}

interface StopoverEditorProps {
  stopovers: Array<{
    location: string;
    minDays: number;
    maxDays: number;
    mandatory: boolean;
  }>;
  onChange: (stopovers: Array<{
    location: string;
    minDays: number;
    maxDays: number;
    mandatory: boolean;
  }>) => void;
}

export function StopoverEditor({ stopovers, onChange }: StopoverEditorProps) {
  const [internalStopovers, setInternalStopovers] = useState<Stopover[]>(
    stopovers.map((s, i) => ({ ...s, id: i.toString() }))
  );

  const updateParent = (newStopovers: Stopover[]) => {
    setInternalStopovers(newStopovers);
    onChange(newStopovers.map(({ id, ...rest }) => rest));
  };

  const addStopover = () => {
    const newStopover: Stopover = {
      id: Date.now().toString(),
      location: "",
      minDays: 2,
      maxDays: 4,
      mandatory: false,
    };
    updateParent([...internalStopovers, newStopover]);
  };

  const updateStopover = (id: string, updates: Partial<Stopover>) => {
    const updated = internalStopovers.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    updateParent(updated);
  };

  const removeStopover = (id: string) => {
    const filtered = internalStopovers.filter((s) => s.id !== id);
    updateParent(filtered);
  };

  return (
    <div className="space-y-4">
      {internalStopovers.map((stopover) => (
        <Card key={stopover.id} className="p-4 border-l-4 border-l-accent/50">
          <div className="grid gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Lokalizacja przesiadki</span>
                </div>
                <AirportMultiSelect
                  value={stopover.location ? [stopover.location] : []}
                  onChange={(values) =>
                    updateStopover(stopover.id, { location: values[0] || "" })
                  }
                  placeholder="Dubai, Bliski Wschód..."
                />
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStopover(stopover.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Czas trwania: {stopover.minDays}-{stopover.maxDays} dni
                  </span>
                </div>
                <div className="px-3">
                  <Slider
                    value={[stopover.minDays, stopover.maxDays]}
                    onValueChange={([min, max]) =>
                      updateStopover(stopover.id, { minDays: min, maxDays: max })
                    }
                    min={1}
                    max={7}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 dzień</span>
                    <span>7 dni</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Obowiązkowa przesiadka</div>
                  <div className="text-xs text-muted-foreground">
                    {stopover.mandatory 
                      ? "Zawsze uwzględniaj w wynikach" 
                      : "Pokaż tylko jeśli opłacalne"
                    }
                  </div>
                </div>
                <Switch
                  checked={stopover.mandatory}
                  onCheckedChange={(mandatory) =>
                    updateStopover(stopover.id, { mandatory })
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addStopover}
        className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-solid"
      >
        <Plus className="mr-2 h-4 w-4" />
        Dodaj przesiadkę
      </Button>

      {internalStopovers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            Dodaj przesiadki, aby znaleźć tańsze opcje podróży
          </p>
          <p className="text-xs mt-1">
            Przykład: 3-dniowa przesiadka w Dubaju w drodze do Bangkoku
          </p>
        </div>
      )}
    </div>
  );
}