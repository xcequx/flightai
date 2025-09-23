import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Sparkles, Plane, MapPin, Calendar, DollarSign, Users, ArrowLeft, Loader2,
  Settings, Clock, Home, Car, ChevronDown, Route, Zap, AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface VacationFormData {
  // Basic fields
  budget: string;
  region: string;
  duration: string;
  travelStyle: string;
  interests: string[];
  departureCity: string;
  
  // Enhanced fields for longer trips
  isMultiCity: boolean;
  travelPace: string;
  accommodationType: string;
  transportPreference: string;
  seasonOptimized: boolean;
  
  // Budget allocation preferences
  budgetFlights: number;
  budgetAccommodation: number;
  budgetFood: number;
  budgetActivities: number;
  
  // Hotel preferences
  hotelPreferences: {
    priceRange: string;
    amenities: string[];
    locationPriority: string;
  };
}




const PlanVacation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<VacationFormData>({
    // Basic fields
    budget: "",
    region: "",
    duration: "",
    travelStyle: "",
    interests: [],
    departureCity: "",
    
    // Enhanced fields
    isMultiCity: false,
    travelPace: "moderate",
    accommodationType: "hotel",
    transportPreference: "flights",
    seasonOptimized: true,
    
    // Budget allocation (percentages)
    budgetFlights: 35,
    budgetAccommodation: 35,
    budgetFood: 20,
    budgetActivities: 10,
    
    // Hotel preferences
    hotelPreferences: {
      priceRange: "mid-range",
      amenities: [],
      locationPriority: "city-center"
    }
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLongTrip, setIsLongTrip] = useState(false);
  const [dailyBudget, setDailyBudget] = useState(0);

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      interests: checked 
        ? [...prev.interests, interest]
        : prev.interests.filter(i => i !== interest)
    }));
  };
  
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      hotelPreferences: {
        ...prev.hotelPreferences,
        amenities: checked
          ? [...prev.hotelPreferences.amenities, amenity]
          : prev.hotelPreferences.amenities.filter(a => a !== amenity)
      }
    }));
  };
  
  const handleBudgetAllocationChange = (category: string, value: number[]) => {
    const newValue = value[0];
    setFormData(prev => ({
      ...prev,
      [`budget${category}`]: newValue
    }));
  };
  
  // Auto-detect long trip and enable advanced options
  useEffect(() => {
    const duration = parseInt(formData.duration);
    const isLong = duration >= 14;
    setIsLongTrip(isLong);
    
    if (isLong && !formData.isMultiCity) {
      setFormData(prev => ({ ...prev, isMultiCity: true }));
      setShowAdvanced(true);
    }
    
    // Calculate daily budget
    const budget = parseFloat(formData.budget);
    if (budget && duration) {
      setDailyBudget(Math.round(budget / duration));
    }
  }, [formData.duration, formData.budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.budget || !formData.region || !formData.duration || 
        !formData.travelStyle || !formData.departureCity) {
      toast({
        title: t('toast.formError'),
        description: t('toast.fillRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Submitting vacation plan request');
      
      const response = await fetch('/api/vacation/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Basic fields
          budget: formData.budget,
          region: formData.region,
          duration: formData.duration,
          travelStyle: formData.travelStyle,
          interests: formData.interests,
          departureCity: formData.departureCity,
          
          // Enhanced fields
          isMultiCity: formData.isMultiCity,
          travelPace: formData.travelPace,
          accommodationType: formData.accommodationType,
          transportPreference: formData.transportPreference,
          seasonOptimized: formData.seasonOptimized,
          hotelPreferences: formData.hotelPreferences
        })
      });

      console.log('📡 Received response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to generate vacation plan';
        let errorDetails = null;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            errorDetails = errorData.details;
            console.error('❌ Server error response:', errorData);
          } else {
            const textResponse = await response.text();
            console.error('❌ Non-JSON error response:', textResponse);
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Expected JSON response but got:', contentType);
        throw new Error('Server returned invalid response format');
      }

      // Check if response has content
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.error('❌ Empty response body received');
        throw new Error('Server returned empty response');
      }

      // Safe JSON parsing
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Successfully parsed response JSON:', {
          success: data.success,
          hasData: !!data.data,
          timestamp: data.timestamp
        });
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', {
          error: parseError.message,
          responseText: responseText.substring(0, 200) + '...'
        });
        throw new Error('Server returned invalid JSON response');
      }

      // Validate response structure
      if (typeof data !== 'object' || data === null) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Server returned invalid response structure');
      }

      if (data.success) {
        // Validate that we have the required data
        if (!data.data) {
          console.error('❌ Success response missing data field');
          throw new Error('Server response missing vacation plan data');
        }
        
        console.log('✅ Vacation plan generated successfully');
        
        toast({
          title: t('toast.planReady'),
          description: t('toast.planReadyDesc'),
        });
        
        // Navigate to results page with the plan data
        navigate('/vacation-results', { 
          state: { 
            planData: data.data,
            formData 
          } 
        });
      } else {
        // Handle server-side errors
        const errorMessage = data.error || 'Failed to generate vacation plan';
        const errorDetails = data.details;
        
        console.error('❌ Server reported error:', {
          error: errorMessage,
          details: errorDetails,
          timestamp: data.timestamp,
          requestId: data.requestId
        });
        
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Error generating vacation plan:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      let userMessage = t('toast.planErrorDesc');
      
      // Provide more specific error messages based on error type
      if (error.message.includes('timeout') || error.message.includes('abort')) {
        userMessage = 'Request timed out. Please try again with simpler preferences.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('validation')) {
        userMessage = 'Please check your input and try again.';
      } else if (error.message.includes('unavailable') || error.message.includes('configuration')) {
        userMessage = 'Service temporarily unavailable. Please try again later.';
      }
      
      toast({
        title: t('toast.planError'),
        description: userMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-accent/80 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-6 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('vacation.backToHome')}
            </Button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className="h-12 w-12 text-yellow-300" />
                <h1 className="text-4xl md:text-5xl font-bold">{t('vacation.title')}</h1>
              </div>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                {t('vacation.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="floating-card glow-effect bg-card rounded-3xl shadow-2xl border border-white/10 p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Budget */}
                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t('vacation.budget')} *
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    min="500"
                    step="100"
                    placeholder="5000"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="text-lg"
                    data-testid="input-budget"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('vacation.budgetHelper')}
                  </p>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('vacation.duration')} *
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="3"
                    max="30"
                    placeholder="7"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="text-lg"
                    data-testid="input-duration"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Region */}
                <div className="space-y-2">
                  <Label htmlFor="region" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('vacation.region')} *
                  </Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({...formData, region: value})}>
                    <SelectTrigger data-testid="select-region">
                      <SelectValue placeholder={t('common.selectRegion')} />
                    </SelectTrigger>
                    <SelectContent>
                      {t('vacation.regions', { returnObjects: true }).map((region: string, index: number) => (
                        <SelectItem key={index} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Departure City */}
                <div className="space-y-2">
                  <Label htmlFor="departureCity" className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    {t('vacation.departureCity')} *
                  </Label>
                  <Input
                    id="departureCity"
                    placeholder={t('common.defaultCity')}
                    value={formData.departureCity}
                    onChange={(e) => setFormData({...formData, departureCity: e.target.value})}
                    className="text-lg"
                    data-testid="input-departure-city"
                    required
                  />
                </div>
              </div>

              {/* Travel Style */}
              <div className="space-y-2">
                <Label htmlFor="travelStyle" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('vacation.travelStyle')} *
                </Label>
                <Select value={formData.travelStyle} onValueChange={(value) => setFormData({...formData, travelStyle: value})}>
                  <SelectTrigger data-testid="select-travel-style">
                    <SelectValue placeholder={t('common.selectTravelStyle')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t('vacation.travelStyles', { returnObjects: true })).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trip Type & Duration Insights */}
              {isLongTrip && (
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        Long Trip Detected ({formData.duration} days)
                      </h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-800 dark:text-blue-200">
                          <strong>Daily Budget:</strong> {dailyBudget} PLN
                        </p>
                        <p className="text-blue-800 dark:text-blue-200">
                          <strong>Recommended:</strong> Multi-city itinerary
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-800 dark:text-blue-200">
                          <strong>Optimal Cities:</strong> 3-5 destinations
                        </p>
                        <p className="text-blue-800 dark:text-blue-200">
                          <strong>Pace:</strong> 5-7 days per city
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Multi-City Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Multi-City Trip
                  </Label>
                  <Switch
                    checked={formData.isMultiCity}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ ...prev, isMultiCity: checked }));
                      if (checked) setShowAdvanced(true);
                    }}
                    data-testid="switch-multi-city"
                  />
                </div>
                {formData.isMultiCity && (
                  <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted rounded-lg">
                    {/* Travel Pace */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Travel Pace
                      </Label>
                      <Select 
                        value={formData.travelPace} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, travelPace: value }))}
                      >
                        <SelectTrigger data-testid="select-travel-pace">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow (3-5 cities, 7+ days each)</SelectItem>
                          <SelectItem value="moderate">Moderate (4-7 cities, 5-7 days each)</SelectItem>
                          <SelectItem value="fast">Fast (6+ cities, 3-5 days each)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Transport Preference */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Transport Preference
                      </Label>
                      <Select 
                        value={formData.transportPreference} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, transportPreference: value }))}
                      >
                        <SelectTrigger data-testid="select-transport">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flights">Flights (fast, long distances)</SelectItem>
                          <SelectItem value="trains">Trains (scenic, regional)</SelectItem>
                          <SelectItem value="buses">Buses (budget-friendly)</SelectItem>
                          <SelectItem value="mixed">Mixed (optimize per route)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  {t('vacation.interests')} ({t('common.optional')})
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('vacation.interestsDesc')}
                </p>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {t('vacation.interestOptions', { returnObjects: true }).map((interest: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${index}`}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={(checked) => handleInterestChange(interest, checked as boolean)}
                        data-testid={`checkbox-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <Label htmlFor={`interest-${index}`} className="text-sm font-normal cursor-pointer">
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" data-testid="button-advanced-options">
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Advanced Options
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-6 mt-6">
                  
                  {/* Accommodation Preferences */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Home className="h-5 w-5" />
                        Accommodation Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Accommodation Type</Label>
                          <Select 
                            value={formData.accommodationType} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, accommodationType: value }))}
                          >
                            <SelectTrigger data-testid="select-accommodation">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hotel">Hotels (comfort & service)</SelectItem>
                              <SelectItem value="hostel">Hostels (budget & social)</SelectItem>
                              <SelectItem value="airbnb">Apartments/Airbnb (local experience)</SelectItem>
                              <SelectItem value="mixed">Mixed (optimize per city)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Price Range Preference</Label>
                          <Select 
                            value={formData.hotelPreferences.priceRange} 
                            onValueChange={(value) => setFormData(prev => ({ 
                              ...prev, 
                              hotelPreferences: { ...prev.hotelPreferences, priceRange: value }
                            }))}
                          >
                            <SelectTrigger data-testid="select-price-range">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="budget">Budget (maximize savings)</SelectItem>
                              <SelectItem value="mid-range">Mid-range (balance value & comfort)</SelectItem>
                              <SelectItem value="luxury">Luxury (premium experience)</SelectItem>
                              <SelectItem value="mixed">Mixed across cities</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Hotel Amenities */}
                      <div className="space-y-2">
                        <Label>Important Amenities</Label>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {['WiFi', 'Breakfast', 'Gym', 'Pool', 'Spa', 'Business Center', 'Kitchen', 'Laundry'].map((amenity) => (
                            <div key={amenity} className="flex items-center space-x-2">
                              <Checkbox
                                id={`amenity-${amenity}`}
                                checked={formData.hotelPreferences.amenities.includes(amenity)}
                                onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                                data-testid={`checkbox-amenity-${amenity.toLowerCase()}`}
                              />
                              <Label htmlFor={`amenity-${amenity}`} className="text-sm cursor-pointer">
                                {amenity}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Budget Allocation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="h-5 w-5" />
                        Budget Allocation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[
                        { key: 'Flights', value: formData.budgetFlights, color: 'text-blue-600' },
                        { key: 'Accommodation', value: formData.budgetAccommodation, color: 'text-green-600' },
                        { key: 'Food', value: formData.budgetFood, color: 'text-orange-600' },
                        { key: 'Activities', value: formData.budgetActivities, color: 'text-purple-600' }
                      ].map(({ key, value, color }) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className={color}>{key}</Label>
                            <span className={`font-semibold ${color}`}>{value}%</span>
                          </div>
                          <Slider
                            value={[value]}
                            onValueChange={(val) => handleBudgetAllocationChange(key, val)}
                            max={60}
                            min={5}
                            step={5}
                            className="w-full"
                            data-testid={`slider-budget-${key.toLowerCase()}`}
                          />
                          <p className="text-xs text-muted-foreground">
                            ≈ {Math.round((parseFloat(formData.budget) || 0) * value / 100)} PLN
                          </p>
                        </div>
                      ))}
                      <div className="text-sm text-muted-foreground">
                        Total: {formData.budgetFlights + formData.budgetAccommodation + formData.budgetFood + formData.budgetActivities}%
                      </div>
                    </CardContent>
                  </Card>

                  {/* Season Optimization */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Season Optimization</Label>
                      <p className="text-sm text-muted-foreground">
                        Optimize travel dates for weather and pricing
                      </p>
                    </div>
                    <Switch
                      checked={formData.seasonOptimized}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, seasonOptimized: checked }))}
                      data-testid="switch-season-optimization"
                    />
                  </div>

                </CollapsibleContent>
              </Collapsible>

              {/* Submit */}
              <div className="text-center pt-6">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isLoading}
                  className="btn-primary-enhanced px-12 py-4 text-lg font-semibold"
                  data-testid="button-generate-plan"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('vacation.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {t('vacation.generatePlan')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PlanVacation;