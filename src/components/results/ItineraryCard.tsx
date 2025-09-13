import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskMeter } from "./RiskMeter";
import { RouteMap } from "./RouteMap";
import { PriceBreakdown } from "./PriceBreakdown";
import { 
  Plane, 
  Clock, 
  MapPin, 
  AlertTriangle,
  ExternalLink,
  Info,
  Calendar
} from "lucide-react";
import { useState } from "react";

interface FlightResult {
  id: string;
  price: number;
  totalHours: number;
  riskScore: number;
  segments: Array<{
    from: string;
    to: string;
    departure: string;
    arrival: string;
    carrier: string;
    flight: string;
    duration?: string;
  }>;
  stopovers: Array<{ city: string; days: number }>;
  selfTransfer: boolean;
  badges: string[];
  rawData?: any; // Store original API data for booking
}

interface ItineraryCardProps {
  result: FlightResult;
  rank: number;
  sortBy: 'cheapest' | 'fastest' | 'safest' | 'best-mix';
}

export function ItineraryCard({ result, rank, sortBy }: ItineraryCardProps) {
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleBooking = () => {
    // In a real implementation, this would redirect to booking page with flight data
    const bookingData = {
      flightOffer: result.rawData,
      searchId: result.id,
      price: result.price
    };
    
    // For now, open a new window with booking information
    const bookingWindow = window.open('', '_blank');
    if (bookingWindow) {
      bookingWindow.document.write(`
        <html>
          <head><title>Rezerwacja lotu - ${result.id}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Rezerwacja lotu</h1>
            <p>Cena: ${result.price} PLN</p>
            <p>Trasa: ${result.segments.map(s => `${s.from} → ${s.to}`).join(', ')}</p>
            <p>W prawdziwej aplikacji tutaj byłby formularz rezerwacji</p>
            <pre>${JSON.stringify(bookingData, null, 2)}</pre>
          </body>
        </html>
      `);
    }
  };

  const handleShowDetails = () => {
    setShowDetails(!showDetails);
  };

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      time: date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
    };
  };

  const getRankBadgeVariant = () => {
    if (rank === 1) {
      switch (sortBy) {
        case 'cheapest': return 'bg-success text-success-foreground';
        case 'fastest': return 'bg-primary text-primary-foreground';
        case 'safest': return 'bg-warning text-warning-foreground';
        default: return 'bg-accent text-accent-foreground';
      }
    }
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header with rank and price */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${getRankBadgeVariant()}`}>
              #{rank}
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {result.price.toLocaleString('pl-PL')} PLN
              </div>
              <button
                onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Info className="h-3 w-3" />
                Zobacz składniki ceny
              </button>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              {formatDuration(result.totalHours)}
            </div>
            <RiskMeter score={result.riskScore} size="sm" />
          </div>
        </div>

        {/* Price Breakdown */}
        {showPriceBreakdown && (
          <div className="mb-4">
            <PriceBreakdown 
              price={result.price}
              segments={result.segments.length}
              selfTransfer={result.selfTransfer}
            />
          </div>
        )}

        {/* Route visualization */}
        <div className="mb-4">
          <RouteMap segments={result.segments} stopovers={result.stopovers} />
        </div>

        {/* Flight segments */}
        <div className="space-y-3 mb-4">
          {result.segments.map((segment, index) => {
            const dep = formatDateTime(segment.departure);
            const arr = formatDateTime(segment.arrival);
            
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Plane className="h-4 w-4 text-primary" />
                  <span className="font-mono font-semibold">
                    {segment.from} → {segment.to}
                  </span>
                </div>
                
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <div>{dep.time}</div>
                    <div>{dep.date}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-foreground">{segment.carrier}</div>
                    <div>{segment.flight}</div>
                  </div>
                  <div className="text-right">
                    <div>{arr.time}</div>
                    <div>{arr.date}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stopovers */}
        {result.stopovers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" />
              Przesiadki
            </div>
            <div className="flex flex-wrap gap-2">
              {result.stopovers.map((stopover, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {stopover.city} - {stopover.days} dni
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {result.badges.map((badge, index) => {
            const isWarning = badge.includes('Self-Transfer') || badge.includes('Airport Change');
            return (
              <Badge 
                key={index} 
                variant={isWarning ? "destructive" : "secondary"}
                className="text-xs"
              >
                {isWarning && <AlertTriangle className="h-3 w-3 mr-1" />}
                {badge}
              </Badge>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" size="lg" onClick={handleBooking}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Zarezerwuj teraz
          </Button>
          <Button variant="outline" size="lg" onClick={handleShowDetails}>
            {showDetails ? 'Ukryj szczegóły' : 'Zobacz szczegóły'}
          </Button>
        </div>

        {/* Detailed flight information */}
        {showDetails && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-3">Szczegóły lotu</h4>
            <div className="space-y-3 text-sm">
              {result.segments.map((segment, index) => (
                <div key={index} className="border-l-2 border-primary pl-3">
                  <div className="font-medium">Segment {index + 1}</div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Odlot: {new Date(segment.departure).toLocaleString('pl-PL')}</div>
                    <div>Przylot: {new Date(segment.arrival).toLocaleString('pl-PL')}</div>
                    <div>Linia: {segment.carrier}</div>
                    <div>Numer lotu: {segment.flight}</div>
                    {segment.duration && <div>Czas lotu: {segment.duration}</div>}
                  </div>
                </div>
              ))}
              {result.rawData && (
                <div className="mt-4 pt-3 border-t">
                  <div className="font-medium mb-2">Informacje techniczne</div>
                  <div className="text-xs text-muted-foreground">
                    ID lotu: {result.rawData.id}<br/>
                    Źródło: Amadeus API<br/>
                    Ostatnia aktualizacja: {new Date().toLocaleString('pl-PL')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk warning for self-transfers */}
        {result.selfTransfer && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-warning-foreground">Samodzielna przesiadka</div>
                <div className="text-muted-foreground mt-1">
                  Pamiętaj o odebraniu i ponownym nadaniu bagażu. Minimalne czasy przesiadek: 3-4 godziny.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}