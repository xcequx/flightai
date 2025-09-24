import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  { code: "WAW", name: "Warsaw (Chopin)", city: "Warsaw", country: "PL" },
  { code: "KRK", name: "Krakow (Balice)", city: "Krakow", country: "PL" },
  { code: "GDN", name: "Gdansk (Rębiechowo)", city: "Gdansk", country: "PL" },
  { code: "LHR", name: "Heathrow", city: "London", country: "GB" },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "FR" },
  { code: "FRA", name: "Frankfurt am Main", city: "Frankfurt", country: "DE" },
  { code: "DXB", name: "Dubai International", city: "Dubai", country: "AE" },
  { code: "DOH", name: "Hamad International", city: "Doha", country: "QA" },
  { code: "AUH", name: "Abu Dhabi International", city: "Abu Dhabi", country: "AE" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "TR" },
  { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "TH" },
  { code: "NRT", name: "Narita International", city: "Tokyo", country: "JP" },
  { code: "SIN", name: "Changi Airport", city: "Singapore", country: "SG" },
  { code: "ICN", name: "Incheon International", city: "Seoul", country: "KR" },
];

// Note: These will be replaced with translation keys
const getCountries = (t: any) => [
  { code: "PL", name: t('search.countries.poland'), flag: "🇵🇱" },
  { code: "DE", name: t('search.countries.germany'), flag: "🇩🇪" },
  { code: "FR", name: t('search.countries.france'), flag: "🇫🇷" },
  { code: "GB", name: t('search.countries.unitedKingdom'), flag: "🇬🇧" },
  { code: "IT", name: t('search.countries.italy'), flag: "🇮🇹" },
  { code: "ES", name: t('search.countries.spain'), flag: "🇪🇸" },
  { code: "NL", name: t('search.countries.netherlands'), flag: "🇳🇱" },
  { code: "CZ", name: t('search.countries.czechRepublic'), flag: "🇨🇿" },
  { code: "AT", name: t('search.countries.austria'), flag: "🇦🇹" },
  { code: "CH", name: t('search.countries.switzerland'), flag: "🇨🇭" },
  { code: "TH", name: t('search.countries.thailand'), flag: "🇹🇭" },
  { code: "JP", name: t('search.countries.japan'), flag: "🇯🇵" },
  { code: "SG", name: t('search.countries.singapore'), flag: "🇸🇬" },
  { code: "AE", name: t('search.countries.uae'), flag: "🇦🇪" },
  { code: "TR", name: t('search.countries.turkey'), flag: "🇹🇷" },
  { code: "US", name: t('search.countries.usa'), flag: "🇺🇸" },
  { code: "CA", name: t('search.countries.canada'), flag: "🇨🇦" },
  { code: "AU", name: t('search.countries.australia'), flag: "🇦🇺" },
  { code: "IN", name: t('search.countries.india'), flag: "🇮🇳" },
  { code: "CN", name: t('search.countries.china'), flag: "🇨🇳" },
  { code: "KR", name: t('search.countries.southKorea'), flag: "🇰🇷" },
  { code: "VN", name: t('search.countries.vietnam'), flag: "🇻🇳" },
  { code: "ID", name: t('search.countries.indonesia'), flag: "🇮🇩" },
  { code: "MY", name: t('search.countries.malaysia'), flag: "🇲🇾" },
];

const getRegions = (t: any) => [
  { code: "CEU", name: t('search.regions.centralEurope'), icon: Globe },
  { code: "WEU", name: t('search.regions.westernEurope'), icon: Globe },
  { code: "ME", name: t('search.regions.middleEast'), icon: Globe },
  { code: "SEA", name: t('search.regions.southeastAsia'), icon: Globe },
  { code: "EA", name: t('search.regions.eastAsia'), icon: Globe },
];

export function AirportMultiSelect({
  value,
  onChange,
  placeholder,
  className,
}: AirportMultiSelectProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const countries = getCountries(t);
  const regions = getRegions(t);
  const defaultPlaceholder = placeholder || t('search.airports.placeholder');

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
          placeholder={value.length === 0 ? defaultPlaceholder : t('search.airports.searchPlaceholder')}
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
                {t('search.airports.regions')} - {t('search.airports.regionsDesc')}
              </div>
              <div className="text-xs text-muted-foreground mb-3 px-2 py-1 bg-primary/5 rounded">
                {t('search.airports.regionsHelp')}
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
                {t('search.airports.countries')} - {t('search.airports.countriesDesc')}
              </div>
              <div className="text-xs text-muted-foreground mb-3 px-2 py-1 bg-success/5 rounded border border-success/20">
                💡 <span className="font-medium text-success">{t('common.expertTip')}:</span> {t('search.airports.countriesHelp')}
              </div>
              {filteredCountries.map((country) => {
                // Add neighbor info for popular countries
                const neighborInfo = {
                  'DE': t('search.airports.neighborGermany'),
                  'CZ': t('search.airports.neighborCzech'),
                  'AT': t('search.airports.neighborAustria'),
                  'SK': t('search.airports.neighborSlovakia')
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
                      {neighborInfo[country.code] || `${t('common.code')}: ${country.code}`}
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
                  {t('search.airports.airports')} - {t('search.airports.airportsDesc')}
                </div>
              )}
              <div className="text-xs text-muted-foreground mb-3 px-2 py-1 bg-info/5 rounded">
                {t('search.airports.airportsHelp')}
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
              {t('search.airports.noResults')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}