import { MapPin, Plane } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RouteMapProps {
  segments: Array<{
    from: string;
    to: string;
    departure: string;
    arrival: string;
    carrier: string;
    flight: string;
  }>;
  stopovers: Array<{ city: string; days: number }>;
}

export function RouteMap({ segments, stopovers }: RouteMapProps) {
  const { t } = useTranslation();
  
  // Add defensive checks for segments array
  const validSegments = Array.isArray(segments) ? segments : [];
  const validStopovers = Array.isArray(stopovers) ? stopovers : [];
  
  // Extract unique airports from segments
  const airports = Array.from(new Set([
    validSegments[0]?.from,
    ...validSegments.map(s => s.to)
  ])).filter(Boolean);

  return (
    <div className="bg-muted/20 rounded-lg p-4">
      <div className="flex items-center justify-between relative">
        {airports.map((airport, index) => {
          const isStopover = validStopovers.some(s => 
            s.city.includes(airport) || airport === "DXB" || airport === "DOH" || airport === "AUH"
          );
          const stopoverInfo = validStopovers.find(s => 
            s.city.includes(airport) || airport === "DXB" || airport === "DOH" || airport === "AUH"
          );

          return (
            <div key={airport} className="flex flex-col items-center relative z-10">
              {/* Airport dot */}
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${index === 0 ? 'bg-success border-success text-white' : 
                  index === airports.length - 1 ? 'bg-primary border-primary text-white' :
                  isStopover ? 'bg-accent border-accent text-accent-foreground' : 
                  'bg-card border-border'}
              `}>
                {index === 0 || index === airports.length - 1 ? 
                  <MapPin className="h-2 w-2" /> : 
                  isStopover ? <span className="text-xs font-bold">{stopoverInfo?.days}</span> : null
                }
              </div>
              
              {/* Airport code */}
              <div className="text-xs font-mono font-semibold mt-1">
                {airport}
              </div>
              
              {/* Stopover info */}
              {isStopover && stopoverInfo && (
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  {stopoverInfo.days} {t('results.routeMap.days')}
                </div>
              )}

              {/* Connection line to next airport */}
              {index < airports.length - 1 && (
                <>
                  <div className="absolute top-2 left-6 right-0 h-0.5 bg-border -translate-y-0.5" />
                  <div className="absolute top-1 left-8 right-2 flex justify-center">
                    <Plane className="h-3 w-3 text-primary bg-background p-0.5" />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Route description */}
      <div className="mt-3 text-xs text-muted-foreground text-center">
        <span className="font-medium">{t('results.routeMap.route')}</span> {airports.join(' → ')}
        {validStopovers.length > 0 && (
          <span className="ml-2">
            • {validStopovers.length} {validStopovers.length === 1 ? t('results.routeMap.layover') : t('results.routeMap.layovers')}
          </span>
        )}
      </div>
    </div>
  );
}