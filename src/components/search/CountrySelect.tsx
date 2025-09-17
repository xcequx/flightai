import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface CountrySelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

const countries = [
  { code: "PL", name: "Polska", flag: "🇵🇱", neighbors: ["DE", "CZ", "SK", "LT", "BY", "UA"] },
  { code: "DE", name: "Niemcy", flag: "🇩🇪", neighbors: ["PL", "CZ", "AT", "CH", "FR", "BE", "NL", "DK"] },
  { code: "FR", name: "Francja", flag: "🇫🇷", neighbors: ["ES", "IT", "CH", "DE", "BE", "LU"] },
  { code: "IT", name: "Włochy", flag: "🇮🇹", neighbors: ["FR", "CH", "AT", "SI", "HR"] },
  { code: "ES", name: "Hiszpania", flag: "🇪🇸", neighbors: ["FR", "PT"] },
  { code: "GB", name: "Wielka Brytania", flag: "🇬🇧", neighbors: ["IE", "FR"] },
  { code: "NL", name: "Holandia", flag: "🇳🇱", neighbors: ["DE", "BE"] },
  { code: "CZ", name: "Czechy", flag: "🇨🇿", neighbors: ["PL", "DE", "AT", "SK"] },
  { code: "AT", name: "Austria", flag: "🇦🇹", neighbors: ["DE", "CZ", "SK", "HU", "SI", "IT", "CH"] },
  { code: "CH", name: "Szwajcaria", flag: "🇨🇭", neighbors: ["DE", "FR", "IT", "AT"] },
];

export function CountrySelect({ value, onChange, placeholder = "Wybierz kraj", className }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [includeNeighbors, setIncludeNeighbors] = useState(false);
  const [neighboringCountries, setNeighboringCountries] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountries = countries.filter(country => value.includes(country.code));
  const allSelectedCodes = includeNeighbors ? [...value, ...neighboringCountries] : value;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Calculate neighboring countries when selection changes
    const neighbors = new Set<string>();
    value.forEach(countryCode => {
      const country = countries.find(c => c.code === countryCode);
      if (country) {
        country.neighbors.forEach(neighbor => {
          if (!value.includes(neighbor)) {
            neighbors.add(neighbor);
          }
        });
      }
    });
    setNeighboringCountries(Array.from(neighbors));
  }, [value]);

  const toggleCountry = (countryCode: string) => {
    const newValue = value.includes(countryCode)
      ? value.filter(code => code !== countryCode)
      : [...value, countryCode];
    onChange(newValue);
  };

  const getDisplayNames = () => {
    if (allSelectedCodes.length === 0) return placeholder;
    if (allSelectedCodes.length === 1) {
      const country = countries.find(c => c.code === allSelectedCodes[0]);
      return country ? `${country.flag} ${country.name}` : allSelectedCodes[0];
    }
    return `${allSelectedCodes.length} krajów`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-left font-normal h-10"
      >
        <span className="truncate">{getDisplayNames()}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedCountries.map(country => (
            <Badge key={country.code} variant="secondary" className="text-xs">
              {country.flag} {country.name}
              <button
                type="button"
                onClick={() => toggleCountry(country.code)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          ))}
          {includeNeighbors && neighboringCountries.length > 0 && (
            <Badge variant="outline" className="text-xs bg-success/10 border-success text-success">
              📈 +{neighboringCountries.length} sąsiadów (tańsze opcje)
            </Badge>
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-80 overflow-auto">
          {value.length > 0 && (
            <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-start space-x-3">
                <Globe className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="includeNeighbors"
                      checked={includeNeighbors}
                      onCheckedChange={(checked) => setIncludeNeighbors(!!checked)}
                      data-testid="checkbox-include-neighbors-dropdown"
                    />
                    <label htmlFor="includeNeighbors" className="text-sm font-medium cursor-pointer">
                      Uwzględnij kraje sąsiednie
                    </label>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="font-medium text-primary">
                      📈 Rozszerzamy wyszukiwanie na kraje sąsiadujące
                    </p>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <div className="bg-info/10 px-2 py-1 rounded text-info text-center">
                        <div className="font-medium">Dodatkowe lokalizacje</div>
                        <div>{neighboringCountries.length} krajów sąsiadujących</div>
                      </div>
                    </div>
                    <p className="mt-2">
                      <span className="font-medium">Przykład:</span> Z Polski rozszerzamy wyszukiwanie na Niemcy, Czechy, Słowację - często znajdziesz tam tańsze loty.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-2">
            {countries.map(country => {
              const isNeighbor = neighboringCountries.includes(country.code);
              const isSelected = value.includes(country.code);
              
              return (
                <div
                  key={country.code}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm transition-colors ${
                    isNeighbor ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => toggleCountry(country.code)}
                  data-testid={`country-select-${country.code}`}
                >
                  <div className="flex items-center justify-center w-4 h-4">
                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                  </div>
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{country.name}</div>
                    {isNeighbor && (
                      <div className="text-xs text-primary font-medium">
                        🔗 Sąsiad - może być taniej
                      </div>
                    )}
                  </div>
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}