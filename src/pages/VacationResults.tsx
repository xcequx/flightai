import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, MapPin, Calendar, DollarSign, Plane, Hotel, 
  Clock, Star, Info, Download, Share2, Heart, Users 
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
  
  if (!planData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{t('vacationResults.noData')}</h2>
          <p className="text-muted-foreground mb-6">{t('vacationResults.noDataDesc')}</p>
          <Button onClick={() => navigate('/plan-vacation')}>
            {t('vacationResults.backToPlan')}
          </Button>
        </Card>
      </div>
    );
  }

  const { vacationPlan, hotelRecommendations, flightRouting, requestSummary } = planData;

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
                    {vacationPlan.destinations?.length || 0}
                  </div>
                  <p className="text-muted-foreground">{t('vacationResults.destinations')}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {formatCurrency(vacationPlan.totalBudget || requestSummary.budget)}
                  </div>
                  <p className="text-muted-foreground">{t('vacationResults.estimatedCost')}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {vacationPlan.bestTravelDates?.length || 0}
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
                {vacationPlan.destinations?.map((destination, index) => (
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
                    {destination.highlights && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{t('vacationResults.mainAttractions')}:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {destination.highlights.map((highlight, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('vacationResults.noDestinations')}</p>
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
                {vacationPlan.budgetBreakdown ? (
                  Object.entries(vacationPlan.budgetBreakdown).map(([category, amount]) => (
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
                        {formatCurrency(Number(amount))}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{t('vacationResults.flights')} (40%)</span>
                      <span className="font-semibold">
                        {formatCurrency(requestSummary.budget * 0.4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('vacationResults.accommodation')} (30%)</span>
                      <span className="font-semibold">
                        {formatCurrency(requestSummary.budget * 0.3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('vacationResults.activities')} (15%)</span>
                      <span className="font-semibold">
                        {formatCurrency(requestSummary.budget * 0.15)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('vacationResults.meals')} (15%)</span>
                      <span className="font-semibold">
                        {formatCurrency(requestSummary.budget * 0.15)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t('vacationResults.totalBudget')}</span>
                      <span>{formatCurrency(requestSummary.budget)}</span>
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
          {vacationPlan.culturalTips && vacationPlan.culturalTips.length > 0 && (
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-amber-600" />
                  {t('vacationResults.culturalTips')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {vacationPlan.culturalTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
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