import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { DollarSign, Clock, AlertTriangle, Settings } from "lucide-react";

interface ConstraintSlidersProps {
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
  onPreferencesChange: (preferences: { price: number; time: number; risk: number }) => void;
  onConstraintsChange: (constraints: {
    maxTotalHours: number;
    allowSelfTransfer: boolean;
    allowPositioningFlights: boolean;
  }) => void;
}

export function ConstraintSliders({
  preferences,
  constraints,
  onPreferencesChange,
  onConstraintsChange,
}: ConstraintSlidersProps) {
  const updatePreference = (key: keyof typeof preferences, value: number) => {
    const total = Object.values(preferences).reduce((sum, val) => sum + val, 0);
    const others = Object.entries(preferences).filter(([k]) => k !== key);
    const othersSum = others.reduce((sum, [, val]) => sum + val, 0);
    
    if (othersSum === 0) {
      // If other values are 0, distribute the remaining equally
      const remaining = 100 - value;
      const perOther = Math.floor(remaining / others.length);
      const newPrefs = { ...preferences, [key]: value };
      others.forEach(([k], i) => {
        newPrefs[k as keyof typeof preferences] = 
          i === others.length - 1 ? remaining - (perOther * (others.length - 1)) : perOther;
      });
      onPreferencesChange(newPrefs);
    } else {
      // Proportionally adjust other values
      const remaining = 100 - value;
      const scale = remaining / othersSum;
      const newPrefs = { ...preferences, [key]: value };
      others.forEach(([k, val]) => {
        newPrefs[k as keyof typeof preferences] = Math.round(val * scale);
      });
      onPreferencesChange(newPrefs);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preference Weights */}
      <div>
        <h5 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Priorytet wyszukiwania (suma: 100%)
        </h5>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="text-sm">Najniższa cena</span>
              </div>
              <span className="text-sm font-medium text-success">
                {preferences.price}%
              </span>
            </div>
            <Slider
              value={[preferences.price]}
              onValueChange={([value]) => updatePreference('price', value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">Najkrótszy czas</span>
              </div>
              <span className="text-sm font-medium text-primary">
                {preferences.time}%
              </span>
            </div>
            <Slider
              value={[preferences.time]}
              onValueChange={([value]) => updatePreference('time', value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm">Najmniejsze ryzyko</span>
              </div>
              <span className="text-sm font-medium text-warning">
                {preferences.risk}%
              </span>
            </div>
            <Slider
              value={[preferences.risk]}
              onValueChange={([value]) => updatePreference('risk', value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Hard Constraints */}
      <div className="pt-4 border-t border-border">
        <h5 className="text-sm font-medium mb-4">Ograniczenia</h5>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Maksymalny czas podróży</span>
              <span className="text-sm font-medium">
                {constraints.maxTotalHours}h
              </span>
            </div>
            <Slider
              value={[constraints.maxTotalHours]}
              onValueChange={([value]) =>
                onConstraintsChange({ ...constraints, maxTotalHours: value })
              }
              min={12}
              max={72}
              step={6}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>12h</span>
              <span>72h</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium">Samodzielne przesiadki</div>
              <div className="text-xs text-muted-foreground">
                Osobne bilety, wyższe ryzyko, niższa cena
              </div>
            </div>
            <Switch
              checked={constraints.allowSelfTransfer}
              onCheckedChange={(allowSelfTransfer) =>
                onConstraintsChange({ ...constraints, allowSelfTransfer })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium">Loty pozycjonujące</div>
              <div className="text-xs text-muted-foreground">
                Dodatkowe loty do tanich hubów komunikacyjnych
              </div>
            </div>
            <Switch
              checked={constraints.allowPositioningFlights}
              onCheckedChange={(allowPositioningFlights) =>
                onConstraintsChange({ ...constraints, allowPositioningFlights })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}