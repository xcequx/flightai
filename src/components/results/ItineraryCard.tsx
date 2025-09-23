import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
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
  Calendar,
  TrendingDown,
  Coins,
  Star,
  Heart,
  Globe,
  Camera
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
  multiLeg?: boolean;
  stopoverInfo?: {
    hub: {
      iata: string;
      name: string;
      country: string;
      city: string;
      attractions: string[];
      description: string;
      averageDailyCost: number;
      minLayoverDays: number;
      maxLayoverDays: number;
    };
    layoverDays: number;
    savings: number;
    savingsPercent: number;
    directPrice: number;
    totalCostWithStay: number;
  };
}

interface ItineraryCardProps {
  result: FlightResult;
  rank: number;
  sortBy: 'cheapest' | 'fastest' | 'safest' | 'best-mix';
}

export function ItineraryCard({ result, rank, sortBy }: ItineraryCardProps) {
  const { t } = useTranslation();
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
          <head><title>${t('results.bookingTitle')} - ${result.id}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>${t('results.bookingTitle')}</h1>
            <p>${t('results.priceLabel')}: ${result.price} PLN</p>
            <p>${t('results.routeLabel')}: ${result.segments.map(s => `${s.from} → ${s.to}`).join(', ')}</p>
            <p>${t('results.bookingFormText')}</p>
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
              <div className="flex items-center gap-3 mb-1">
                <div className="text-2xl font-bold text-foreground">
                  {result.price.toLocaleString('pl-PL')} PLN
                </div>
                {result.stopoverInfo && result.stopoverInfo.savings > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full">
                    <TrendingDown className="h-3 w-3" />
                    <span className="text-xs font-semibold">
                      -{result.stopoverInfo.savingsPercent}%
                    </span>
                  </div>
                )}
              </div>
              {result.stopoverInfo && result.stopoverInfo.savings > 0 && (
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="line-through">{result.stopoverInfo.directPrice.toLocaleString('pl-PL')} PLN</span>
                  <span className="ml-2 text-success font-medium">
                    {t('results.savingsAmount', { amount: result.stopoverInfo.savings.toLocaleString('pl-PL') })}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Info className="h-3 w-3" />
                {t('results.showPriceBreakdown')}
              </button>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              {formatDuration(result.totalHours)}
            </div>
            <RiskMeter score={result.riskScore} size="sm" />
            {result.multiLeg && (
              <Badge variant="secondary" className="text-xs mt-2">
                <Globe className="h-3 w-3 mr-1" />
                {t('results.multiCityTrip')}
              </Badge>
            )}
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

        {/* Enhanced Multi-Leg Stopover Information */}
        {result.multiLeg && result.stopoverInfo && (
          <div className="mb-4 p-4 bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {t('results.daysIn', { days: result.stopoverInfo.layoverDays, city: result.stopoverInfo.hub.city })}
                  </h4>
                  <p className="text-xs text-muted-foreground">{result.stopoverInfo.hub.country}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-success text-sm font-semibold">
                  <Coins className="h-4 w-4" />
                  {result.stopoverInfo.savings > 0 ? 
                    t('results.savingsDisplay', { amount: result.stopoverInfo.savings }) : 
                    t('results.extraCost', { amount: Math.abs(result.stopoverInfo.savings) })}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {result.stopoverInfo.hub.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-warning" />
                  <span className="font-medium">{t('results.topAttractions')}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {result.stopoverInfo.hub.attractions.slice(0, 3).map((attraction, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      {attraction}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('results.dailyCost')}</span>
                    <span className="font-medium">${result.stopoverInfo.hub.averageDailyCost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('results.totalCostWithStay')}</span>
                    <span className="font-semibold text-foreground">
                      {Math.round(result.stopoverInfo.totalCostWithStay).toLocaleString('pl-PL')} PLN
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-info/10 border border-info/20 rounded text-xs">
              <Heart className="h-3 w-3 text-info" />
              <span className="text-info-foreground">
                {t('results.idealCityBreak', { 
                  minDays: result.stopoverInfo.hub.minLayoverDays, 
                  maxDays: result.stopoverInfo.hub.maxLayoverDays, 
                  city: result.stopoverInfo.hub.city 
                })}
              </span>
            </div>
          </div>
        )}

        {/* Traditional Stopovers */}
        {!result.multiLeg && result.stopovers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" />
              {t('results.stopovers')}
            </div>
            <div className="flex flex-wrap gap-2">
              {result.stopovers.map((stopover, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {t('results.stopoverDays', { city: stopover.city, days: stopover.days })}
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
            {t('results.bookNowCard')}
          </Button>
          <Button variant="outline" size="lg" onClick={handleShowDetails}>
            {showDetails ? t('results.hideDetails') : t('results.showDetailsCard')}
          </Button>
        </div>

        {/* Detailed flight information */}
        {showDetails && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-3">{t('results.flightDetails')}</h4>
            <div className="space-y-3 text-sm">
              {result.segments.map((segment, index) => (
                <div key={index} className="border-l-2 border-primary pl-3">
                  <div className="font-medium">{t('results.segment', { number: index + 1 })}</div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>{t('results.departure')} {new Date(segment.departure).toLocaleString('pl-PL')}</div>
                    <div>{t('results.arrival')} {new Date(segment.arrival).toLocaleString('pl-PL')}</div>
                    <div>{t('results.airline')} {segment.carrier}</div>
                    <div>{t('results.flightNumber')} {segment.flight}</div>
                    {segment.duration && <div>{t('results.flightDuration')} {segment.duration}</div>}
                  </div>
                </div>
              ))}
              {result.rawData && (
                <div className="mt-4 pt-3 border-t">
                  <div className="font-medium mb-2">{t('results.technicalInfo')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('results.flightId')} {result.rawData.id}<br/>
                    {t('results.dataSource')} Amadeus API<br/>
                    {t('results.lastUpdate')} {new Date().toLocaleString('pl-PL')}
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
                <div className="font-medium text-warning-foreground">{t('results.selfTransfer')}</div>
                <div className="text-muted-foreground mt-1">
                  {t('results.selfTransferWarning')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}