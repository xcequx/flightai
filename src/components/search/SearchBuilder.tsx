import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AirportMultiSelect } from "./AirportMultiSelect";
import { CountrySelect } from "./CountrySelect";
import { StopoverEditor } from "./StopoverEditor";
import { ConstraintSliders } from "./ConstraintSliders";
import { DateRangePicker } from "./DateRangePicker";
import { DateFlexibility } from "./DateFlexibility";
import { Search, Lightbulb, TrendingDown, DollarSign, MapPin, Info } from "lucide-react";
import { DateRange } from "react-day-picker";

interface SearchBuilderProps {
  onSearch: (params: any) => void;
  isLoading?: boolean;
}

export interface SearchParams {
  origins: string[];
  destinations: string[];
  dateRange: DateRange | undefined;
  departureFlex: number;
  returnFlex: number;
  stopovers: Array<{
    location: string;
    minDays: number;
    maxDays: number;
    mandatory: boolean;
  }>;
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
  autoRecommendStopovers: boolean;
  includeNeighboringCountries: boolean;
}

export function SearchBuilder({ onSearch, isLoading = false }: SearchBuilderProps) {
  const { t } = useTranslation();
  const [params, setParams] = useState<SearchParams>({
    origins: [],
    destinations: [],
    dateRange: undefined,
    departureFlex: 3,
    returnFlex: 3,
    stopovers: [],
    preferences: { price: 60, time: 25, risk: 15 },
    constraints: {
      maxTotalHours: 48,
      allowSelfTransfer: true,
      allowPositioningFlights: false,
    },
    autoRecommendStopovers: true,
    includeNeighboringCountries: false,
  });
  const [localLoading, setLocalLoading] = useState(false);

  // Helper function to convert Date to YYYY-MM-DD string (timezone-safe)
  const formatDateForAPI = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  // Helper function to format validation errors for display
  const formatValidationErrors = (errors: Array<{field: string, message: string}>): string => {
    return errors.map(err => `${err.field}: ${err.message}`).join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields before sending
    if (!params.origins.length) {
      alert(t('search.errorOriginRequired') || 'Please select at least one origin airport');
      return;
    }
    
    if (!params.destinations.length) {
      alert(t('search.errorDestinationRequired') || 'Please select at least one destination airport');
      return;
    }
    
    if (!params.dateRange?.from) {
      alert(t('search.errorDateRequired') || 'Please select travel dates');
      return;
    }
    
    setLocalLoading(true);
    
    try {
      // Convert params to API format (convert Date objects to strings)
      const apiParams = {
        ...params,
        dateRange: {
          from: formatDateForAPI(params.dateRange.from),
          to: params.dateRange.to ? formatDateForAPI(params.dateRange.to) : undefined
        }
      };
      
      console.log('🔄 Sending search request with formatted params:', {
        origins: apiParams.origins,
        destinations: apiParams.destinations,
        dateRange: apiParams.dateRange,
        departureFlex: apiParams.departureFlex,
        returnFlex: apiParams.returnFlex
      });
      
      // Call our Express API for flight search using Aviationstack
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiParams)
      });

      const data = await response.json();

      // Handle API key missing scenario
      if (data.requiresApiKey) {
        console.log('⚠️ API key required:', data.message);
        
        // Show user-friendly message about API key setup
        const alertMessage = `${data.message}\n\n${data.instructions.join('\n')}\n\n${t('search.mockDataNotice')}`;
        alert(alertMessage);
        
        // Continue with mock data but mark as needing API key
        onSearch({ 
          ...params, 
          realFlightData: null, 
          apiKeyRequired: true,
          dataSource: 'mock',
          requiresSetup: true
        });
        return;
      }

      if (data.success) {
        console.log('✅ Flight search successful:', data.meta);
        
        // Log data source information with better formatting
        if (data.meta.dataSource === 'aviationstack') {
          console.log('🛫 Using real flight data from Aviationstack API');
          console.log(`📊 Found ${data.meta.count} flights across ${data.meta.searchedRoutes?.length || 0} routes`);
        } else if (data.meta.dataSource === 'mock') {
          console.log('🎭 Using mock flight data');
          if (data.meta.warning) {
            console.log('⚠️ Warning:', data.meta.warning);
          }
          if (data.meta.error) {
            console.log('❌ API Error:', data.meta.error);
          }
        }
        
        // Pass the real data to the parent component with enhanced metadata
        onSearch({ 
          ...params, 
          realFlightData: data,
          dataSource: data.meta.dataSource,
          searchedRoutes: data.meta.searchedRoutes,
          resultCount: data.meta.count,
          apiWarning: data.meta.warning,
          searchMeta: data.meta
        });
      } else {
        console.error('❌ Flight search error:', data.error);
        
        // Handle validation errors specifically
        if (data.error === 'Validation failed' && data.details && Array.isArray(data.details)) {
          console.error('📋 Validation errors:', data.details);
          
          // Format validation errors for user display
          const formattedErrors = formatValidationErrors(data.details);
          const errorTitle = t('search.errorValidation') || 'Please check your search parameters:';
          alert(`${errorTitle}\n\n${formattedErrors}`);
          
          // Don't fall back to mock data for validation errors - user needs to fix their input
          return;
        }
        
        // Show user-friendly error message based on error type
        let errorMessage = t('search.errorDefault');
        
        if (data.error?.includes('API')) {
          errorMessage = t('search.errorApi');
        } else if (data.error?.includes('timeout')) {
          errorMessage = t('search.errorTimeout');
        } else if (data.error?.includes('rate limit')) {
          errorMessage = t('search.errorRateLimit');
        }
        
        alert(errorMessage);
        
        // Fall back to mock data with error information
        onSearch({ 
          ...params, 
          realFlightData: null, 
          hasError: true, 
          errorMessage: data.error,
          dataSource: 'mock'
        });
      }
    } catch (error) {
      console.error('❌ Network or parsing error:', error);
      
      // Show user-friendly error message
      let errorMessage = t('search.errorNetwork');
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = t('search.errorFetch');
      } else if (error instanceof SyntaxError) {
        errorMessage = t('search.errorParsing');
      }
      
      alert(errorMessage);
      
      // Fall back to mock data with network error information
      onSearch({ 
        ...params, 
        realFlightData: null, 
        hasNetworkError: true, 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        dataSource: 'mock'
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const currentLoading = isLoading || localLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Smart Travel Tips Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <TrendingDown className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              {t('search.smartSavings')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('search.neighboringSavings')}
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-background/50 p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{t('search.exampleRoute')}</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="text-success font-medium">✈️ {t('search.berlinExample')}</div>
                  <div className="text-muted-foreground">{t('search.warsawComparison')}</div>
                  <div className="text-success font-bold">{t('search.savings')}</div>
                </div>
              </div>
              
              <div className="bg-background/50 p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-info" />
                  <span className="font-medium text-sm">{t('search.howItWorks')}</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  {(t('search.howItWorksSteps', { returnObjects: true }) as string[]).map((step: string, index: number) => (
                    <div key={index}>• {step}</div>
                  ))}
                </div>
              </div>
              
              <div className="bg-background/50 p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  <span className="font-medium text-sm">{t('search.expertTip')}</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  {(t('search.expertTipText', { returnObjects: true }) as string[]).map((tip: string, index: number) => (
                    <div key={index} className={index === 2 ? 'text-success font-medium' : ''}>{tip}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Origin & Destination */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('search.whereFrom')}
            </label>
            <AirportMultiSelect
              value={params.origins}
              onChange={(origins) => setParams({ ...params, origins })}
              placeholder={t('search.placeholderOrigin')}
            />
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg border-l-4 border-l-primary/50">
            <Checkbox
              id="includeNeighbors"
              checked={params.includeNeighboringCountries}
              onCheckedChange={(checked) => 
                setParams({ ...params, includeNeighboringCountries: !!checked })
              }
              className="mt-0.5"
              data-testid="checkbox-include-neighbors"
            />
            <div className="flex-1">
              <label htmlFor="includeNeighbors" className="text-sm font-medium text-foreground cursor-pointer">
                {t('search.includeNeighboring')}
              </label>
              <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                <p>
                  {t('search.neighboringDescription')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center gap-2 px-2 py-1 bg-success/10 rounded">
                    <span className="text-success font-medium">Przykład:</span>
                    <span>{t('search.berlinExample').replace('✈️ ', '')}</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded">
                    <span className="text-muted-foreground">vs</span>
                    <span>{t('search.warsawComparison').replace('vs ', '')}</span>
                  </div>
                </div>
                <p className="mt-2">
                  {t('search.neighboringExtended')}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('search.whereTo')}
          </label>
          <AirportMultiSelect
            value={params.destinations}
            onChange={(destinations) => setParams({ ...params, destinations })}
            placeholder={t('search.placeholderDestination')}
          />
        </div>
      </div>

      {/* Date Range & Flexibility */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('search.whenTravel')}
          </label>
          <DateRangePicker
            dateRange={params.dateRange}
            onChange={(dateRange) => setParams({ ...params, dateRange })}
            placeholder={t('search.placeholderDateRange')}
          />
        </div>
        
        <DateFlexibility
          departureFlex={params.departureFlex}
          returnFlex={params.returnFlex}
          onDepartureFlexChange={(departureFlex) => setParams({ ...params, departureFlex })}
          onReturnFlexChange={(returnFlex) => setParams({ ...params, returnFlex })}
        />
      </div>

      {/* Auto-recommend Stopovers */}
      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg border">
        <Lightbulb className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoRecommend"
              checked={params.autoRecommendStopovers}
              onCheckedChange={(checked) => 
                setParams({ ...params, autoRecommendStopovers: !!checked })
              }
            />
            <label htmlFor="autoRecommend" className="text-sm font-medium">
              {t('search.autoRecommendStopovers')}
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('search.stopoverDescription')}
          </p>
        </div>
      </div>

      {/* Manual Stopovers */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('search.customStopovers')}
        </label>
        <StopoverEditor
          stopovers={params.stopovers}
          onChange={(stopovers) => setParams({ ...params, stopovers })}
        />
      </div>

      {/* Preferences & Constraints */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h4 className="font-medium mb-4">{t('search.preferences')}</h4>
          <ConstraintSliders
            preferences={params.preferences}
            constraints={params.constraints}
            onPreferencesChange={(preferences) => 
              setParams({ ...params, preferences })
            }
            onConstraintsChange={(constraints) => 
              setParams({ ...params, constraints })
            }
          />
        </Card>
        
        <div className="flex flex-col justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={currentLoading || params.origins.length === 0 || params.destinations.length === 0 || !params.dateRange?.from}
            className="h-14 text-lg bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
          >
            {currentLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                {t('search.searching')}
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                {t('search.findFlights')}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}