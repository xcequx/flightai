import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, MapPin, Calendar, DollarSign, Plane, Hotel, 
  Clock, Star, Info, Download, Share2, Heart, Users, TrendingUp, 
  AlertTriangle, CheckCircle 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/formatters";

interface Destination {
  name: string;
  country: string;
  duration: number;
  highlights: string[];
  bestTime: string;
}

interface VacationPlan {
  destinations: Destination[];
  totalBudget: number;
  budgetBreakdown: {
    flights: number;
    accommodation: number;
    activities: number;
    meals: number;
    transportation: number;
  };
  bestTravelDates: string[];
  culturalTips: string[];
  dailyItinerary: any[];
}

const VacationResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const { planData, formData } = location.state || {};
  
  // Comprehensive data validation and safe extraction
  const safeGetData = (data: any, fallback: any = {}) => {
    try {
      return data && typeof data === 'object' ? data : fallback;
    } catch (error) {
      console.warn('🚨 Data extraction error:', error);
      return fallback;
    }
  };
  
  const safeGetArray = (data: any, fallback: any[] = []) => {
    try {
      return Array.isArray(data) ? data : fallback;
    } catch (error) {
      console.warn('🚨 Array extraction error:', error);
      return fallback;
    }
  };
  
  const safeGetNumber = (data: any, fallback: number = 0) => {
    try {
      const num = Number(data);
      return isNaN(num) ? fallback : num;
    } catch (error) {
      console.warn('🚨 Number extraction error:', error);
      return fallback;
    }
  };
  
  if (!planData) {
    console.warn('🚨 No plan data available');
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-4">{t('vacationResults.noData')}</h2>
          <p className="text-muted-foreground mb-6">{t('vacationResults.noDataDesc')}</p>
          <Button onClick={() => navigate('/plan-vacation')}>
            {t('vacationResults.backToPlan')}
          </Button>
        </Card>
      </div>
    );
  }

  // Safe data extraction with comprehensive validation
  const {
    vacationPlan: rawVacationPlan,
    hotelRecommendations: rawHotelRecommendations,
    flightRouting: rawFlightRouting,
    budgetOptimization: rawBudgetOptimization,
    requestSummary: rawRequestSummary
  } = planData;
  
  // Validated and safe data objects
  const vacationPlan = safeGetData(rawVacationPlan, {
    destinations: [],
    totalBudget: 0,
    budgetBreakdown: null,
    bestTravelDates: [],
    culturalTips: [],
    dailyItinerary: []
  });
  
  const hotelRecommendations = safeGetData(rawHotelRecommendations, {});
  const flightRouting = safeGetData(rawFlightRouting, {});
  const budgetOptimization = safeGetData(rawBudgetOptimization, {});
  const requestSummary = safeGetData(rawRequestSummary, {
    budget: 0,
    region: 'Unknown',
    duration: 0,
    travelStyle: 'Unknown'
  });
  
  // Validate destinations array
  const destinations = safeGetArray(vacationPlan.destinations).map((dest: any) => ({
    name: dest?.name || 'Unknown Destination',
    country: dest?.country || 'Unknown Country',
    duration: safeGetNumber(dest?.duration, 1),
    highlights: safeGetArray(dest?.highlights),
    bestTime: dest?.bestTime || 'Year-round'
  }));
  
  // Log data validation results
  console.log('✅ Data validation completed:', {
    hasVacationPlan: !!rawVacationPlan,
    destinationsCount: destinations.length,
    hasRequestSummary: !!rawRequestSummary,
    hasHotelRecommendations: Object.keys(hotelRecommendations).length > 0,
    hasFlightRouting: Object.keys(flightRouting).length > 0,
    hasBudgetOptimization: Object.keys(budgetOptimization).length > 0
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('vacationResults.shareTitle'),
          text: t('vacationResults.shareText', { region: requestSummary.region }),
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: t('toast.linkCopied'),
          description: t('toast.linkCopiedDesc')
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('toast.linkCopied'), 
        description: t('toast.linkCopiedDesc')
      });
    }
  };

  // Using dynamic locale-aware formatter instead of hardcoded 'pl-PL'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-accent/80 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/plan-vacation')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('vacationResults.newPlan')}
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-white hover:bg-white/10"
                  data-testid="button-share"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('vacationResults.share')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  data-testid="button-save"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {t('vacationResults.save')}
                </Button>
              </div>
            </div>
            
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t('vacationResults.title')}
              </h1>
              <div className="flex flex-wrap justify-center gap-4 text-lg opacity-90">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {requestSummary.region}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {requestSummary.duration} {t('common.days')}
                </span>
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {formatCurrency(requestSummary.budget)}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {requestSummary.travelStyle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Quick Summary */}
          <Card className="floating-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {t('vacationResults.overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {destinations.length}
                  </div>
                  <p className="text-muted-foreground">{t('vacationResults.destinations')}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {formatCurrency(safeGetNumber(vacationPlan.totalBudget) || safeGetNumber(requestSummary.budget))}
                  </div>
                  <p className="text-muted-foreground">{t('vacationResults.estimatedCost')}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {safeGetArray(vacationPlan.bestTravelDates).length}
                  </div>
                  <p className="text-muted-foreground">{t('vacationResults.recommendedDates')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Destinations */}
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t('vacationResults.recommendedDestinations')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {destinations.length > 0 ? destinations.map((destination, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{destination.name}</h3>
                      <Badge variant="outline">
                        {destination.duration} {t('common.days')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {destination.country}
                    </p>
                    {destination.highlights.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{t('vacationResults.mainAttractions')}:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {destination.highlights.map((highlight, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('vacationResults.noDestinations')}</p>
                    <p className="text-sm mt-2">Unable to load destination information. Please try generating a new plan.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Breakdown */}
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  {t('vacationResults.budgetBreakdown')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vacationPlan.budgetBreakdown && typeof vacationPlan.budgetBreakdown === 'object' ? (
                  Object.entries(vacationPlan.budgetBreakdown).map(([category, amount]) => {
                    const safeAmount = safeGetNumber(amount);
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <span className="capitalize">
                          {category === 'flights' ? t('vacationResults.flights') :
                           category === 'accommodation' ? t('vacationResults.accommodation') :
                           category === 'activities' ? t('vacationResults.activities') :
                           category === 'meals' ? t('vacationResults.meals') :
                           category === 'transportation' ? t('vacationResults.transportation') :
                           category}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(safeAmount)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-3">
                    <div className="text-center mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <Info className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Using estimated budget breakdown based on typical travel expenses
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('vacationResults.flights')} (40%)</span>
                      <span className="font-semibold">
                        {formatCurrency(safeGetNumber(requestSummary.budget) * 0.4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('vacationResults.accommodation')} (30%)</span>
                      <span className="font-semibold">
                        {formatCurrency(safeGetNumber(requestSummary.budget) * 0.3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('vacationResults.activities')} (15%)</span>
                      <span className="font-semibold">
                        {formatCurrency(safeGetNumber(requestSummary.budget) * 0.15)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('vacationResults.meals')} (15%)</span>
                      <span className="font-semibold">
                        {formatCurrency(safeGetNumber(requestSummary.budget) * 0.15)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t('vacationResults.totalBudget')}</span>
                      <span>{formatCurrency(safeGetNumber(requestSummary.budget))}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Flight Routing */}
          {flightRouting && Object.keys(flightRouting).length > 0 && (
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-blue-600" />
                  {t('vacationResults.flightRecommendations')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground mb-4">
                    {t('vacationResults.flightDesc')}
                  </p>
                  {/* Display flight routing information */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm">
                      {t('vacationResults.flightDetailsPlaceholder')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hotel Recommendations */}
          {hotelRecommendations && Object.keys(hotelRecommendations).length > 0 && (
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-purple-600" />
                  {t('vacationResults.accommodationRecommendations')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {t('vacationResults.accommodationDesc')}
                  </p>
                  {/* Display hotel recommendations */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm">
                      {t('vacationResults.accommodationDetailsPlaceholder')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cultural Tips */}
          {safeGetArray(vacationPlan.culturalTips).length > 0 && (
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-amber-600" />
                  {t('vacationResults.culturalTips')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {safeGetArray(vacationPlan.culturalTips).map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{String(tip)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Optimization Insights */}
          {budgetOptimization?.optimization_strategies && typeof budgetOptimization.optimization_strategies === 'object' && (
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Money-Saving Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {budgetOptimization.optimization_strategies.early_booking_savings && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Early Booking Savings
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {String(budgetOptimization.optimization_strategies.early_booking_savings)}
                      </p>
                    </div>
                  )}
                  
                  {budgetOptimization.optimization_strategies.seasonal_timing && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Seasonal Timing
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {String(budgetOptimization.optimization_strategies.seasonal_timing)}
                      </p>
                    </div>
                  )}
                  
                  {budgetOptimization.optimization_strategies.bulk_purchase_benefits && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-purple-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Extended Stay Benefits
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {String(budgetOptimization.optimization_strategies.bulk_purchase_benefits)}
                      </p>
                    </div>
                  )}
                  
                  {budgetOptimization.optimization_strategies.loyalty_programs && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-orange-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Loyalty Programs
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {String(budgetOptimization.optimization_strategies.loyalty_programs)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <Button 
              size="lg"
              onClick={() => navigate('/')}
              className="px-8"
              data-testid="button-search-flights"
            >
              <Plane className="mr-2 h-4 w-4" />
              {t('nav.searchFlights')}
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/plan-vacation')}
              className="px-8"
              data-testid="button-new-plan"
            >
              {t('vacationResults.newPlan')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationResults;