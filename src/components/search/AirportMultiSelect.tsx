import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface AirportMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

// Mock airport data - in real app would come from API
const mockAirports = [
  { code: "WAW", name: "Warszawa (Chopin)", city: "Warszawa", country: "PL" },
  { code: "KRK", name: "Kraków (Balice)", city: "Kraków", country: "PL" },
  { code: "GDN", name: "Gdańsk (Rębiechowo)", city: "Gdańsk", country: "PL" },
  { code: "LHR", name: "Heathrow", city: "Londyn", country: "GB" },
  { code: "CDG", name: "Charles de Gaulle", city: "Paryż", country: "FR" },
  { code: "FRA", name: "Frankfurt am Main", city: "Frankfurt", country: "DE" },
  { code: "DXB", name: "Dubai International", city: "Dubai", country: "AE" },
  { code: "DOH", name: "Hamad International", city: "Doha", country: "QA" },
  { code: "AUH", name: "Abu Dhabi International", city: "Abu Dhabi", country: "AE" },
  { code: "IST", name: "Istanbul Airport", city: "Stambuł", country: "TR" },
  { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "TH" },
  { code: "NRT", name: "Narita International", city: "Tokio", country: "JP" },
  { code: "SIN", name: "Changi Airport", city: "Singapur", country: "SG" },
  { code: "ICN", name: "Incheon International", city: "Seul", country: "KR" },
];

const countries = [
  { code: "PL", name: "Polska", flag: "🇵🇱" },
  { code: "DE", name: "Niemcy", flag: "🇩🇪" },
  { code: "FR", name: "Francja", flag: "🇫🇷" },
  { code: "GB", name: "Wielka Brytania", flag: "🇬🇧" },
  { code: "IT", name: "Włochy", flag: "🇮🇹" },
  { code: "ES", name: "Hiszpania", flag: "🇪🇸" },
  { code: "NL", name: "Holandia", flag: "🇳🇱" },
  { code: "CZ", name: "Czechy", flag: "🇨🇿" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "CH", name: "Szwajcaria", flag: "🇨🇭" },
  { code: "TH", name: "Tajlandia", flag: "🇹🇭" },
  { code: "JP", name: "Japonia", flag: "🇯🇵" },
  { code: "SG", name: "Singapur", flag: "🇸🇬" },
  { code: "AE", name: "ZEA", flag: "🇦🇪" },
  { code: "TR", name: "Turcja", flag: "🇹🇷" },
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "CA", name: "Kanada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "IN", name: "Indie", flag: "🇮🇳" },
  { code: "CN", name: "Chiny", flag: "🇨🇳" },
  { code: "KR", name: "Korea Południowa", flag: "🇰🇷" },
  { code: "VN", name: "Wietnam", flag: "🇻🇳" },
  { code: "ID", name: "Indonezja", flag: "🇮🇩" },
  { code: "MY", name: "Malezja", flag: "🇲🇾" },
];

const regions = [
  { code: "CEU", name: "Europa Środkowa", icon: Globe },
  { code: "WEU", name: "Europa Zachodnia", icon: Globe },
  { code: "ME", name: "Bliski Wschód", icon: Globe },
  { code: "SEA", name: "Azja Południowo-Wschodnia", icon: Globe },
  { code: "EA", name: "Azja Wschodnia", icon: Globe },
];

export function AirportMultiSelect({
  value,
  onChange,
  placeholder = "Wybierz lotniska...",
  className,
}: AirportMultiSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredAirports = mockAirports.filter(
    (airport) =>
      !value.includes(airport.code) &&
      (airport.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        airport.code.toLowerCase().includes(inputValue.toLowerCase()) ||
        airport.city.toLowerCase().includes(inputValue.toLowerCase()))
  );

  const filteredCountries = countries.filter(
    (country) =>
      !value.includes(country.code) &&
      country.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const filteredRegions = regions.filter(
    (region) =>
      !value.includes(region.code) &&
      region.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const addItem = (code: string) => {
    onChange([...value, code]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const removeItem = (code: string) => {
    onChange(value.filter((item) => item !== code));
  };

  const getDisplayName = (code: string) => {
    const airport = mockAirports.find((a) => a.code === code);
    if (airport) return `${airport.code} - ${airport.city}`;
    
    const country = countries.find((c) => c.code === code);
    if (country) return `${country.flag} ${country.name}`;
    
    const region = regions.find((r) => r.code === code);
    if (region) return region.name;
    
    return code;
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className="min-h-[42px] p-2 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-ring cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-1 mb-1">
          {value.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="text-xs font-medium"
            >
              {getDisplayName(item)}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={value.length === 0 ? placeholder : "Dodaj kolejne..."}
          className="border-0 p-0 h-6 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {isOpen && (inputValue || value.length === 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto">
          {/* Regions */}
          {filteredRegions.length > 0 && (
            <div className="p-2 border-b border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Regiony - szerszy wybór, lepsze ceny
              </div>
              <div className="text-xs text-muted-foreground mb-3 px-2 py-1 bg-primary/5 rounded">
                Wybierz cały region aby znaleźć najtańsze opcje z różnych krajów
              </div>
              {filteredRegions.map((region) => (
                <button
                  key={region.code}
                  type="button"
                  className="w-full text-left px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                  onClick={() => addItem(region.code)}
                >
                  <div className="font-medium">{region.name}</div>
                  <div className="text-xs text-muted-foreground">{region.code}</div>
                </button>
              ))}
            </div>
          )}

          {/* Countries */}
          {filteredCountries.length > 0 && (
            <div className="p-2 border-b border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Kraje - rozszerzamy wyszukiwanie na sąsiadujące
              </div>
              <div className="text-xs text-muted-foreground mb-3 px-2 py-1 bg-success/5 rounded border border-success/20">
                💡 <span className="font-medium text-success">Wskazówka:</span> Wybór Niemiec lub Czech często daje tańsze opcje niż loty z Polski
              </div>
              {filteredCountries.map((country) => {
                // Add neighbor info for popular countries
                const neighborInfo = {
                  'DE': 'Sąsiad Polski - często tańsze loty',
                  'CZ': 'Sąsiad Polski - alternatywa dla WAW',
                  'AT': 'Blisko Polski - dobra opcja na południe',
                  'SK': 'Sąsiad Polski - tanie loty do Azji'
                };
                
                return (
                  <button
                    key={country.code}
                    type="button"
                    className="w-full text-left px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                    onClick={() => addItem(country.code)}
                    data-testid={`country-option-${country.code}`}
                  >
                    <div className="font-medium">
                      {country.flag} {country.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {neighborInfo[country.code] || `Kod: ${country.code}`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Airports */}
          {filteredAirports.length > 0 && (
            <div className="p-2">
              {(filteredRegions.length > 0 || filteredCountries.length > 0) && (
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Lotniska - konkretne wybory
                </div>
              )}
              <div className="text-xs text-muted-foreground mb-3 px-2 py-1 bg-info/5 rounded">
                Dokładny wybór lotniska dla maksymalnej kontroli nad trasą
              </div>
              {filteredAirports.map((airport) => (
                <button
                  key={airport.code}
                  type="button"
                  className="w-full text-left px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                  onClick={() => addItem(airport.code)}
                >
                  <div className="font-medium">
                    {airport.code} - {airport.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {airport.city}, {airport.country}
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredAirports.length === 0 && filteredRegions.length === 0 && filteredCountries.length === 0 && inputValue && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nie znaleziono pasujących lokalizacji
            </div>
          )}
        </div>
      )}
    </div>
  );
}