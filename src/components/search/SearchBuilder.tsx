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
import { SearchProgressModal } from "./SearchProgressModal";
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
  // API-required fields
  travelClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  adults: number;
  children: number;
  infants: number;
  maxResults: number;
  nonStop: boolean;
  // UI-only fields (not sent to API)
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
    // API-required fields with defaults
    travelClass: "ECONOMY",
    adults: 1,
    children: 0,
    infants: 0,
    maxResults: 50,
    nonStop: false,
    // UI-only fields
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
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);

  // Helper function to convert Date object or ISO string to YYYY-MM-DD string (timezone-safe)
  const formatDateForAPI = (date: Date | string): string => {
    if (!date) {
      throw new Error('Date is null or undefined');
    }
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // If it's already a string (ISO format), convert to Date first
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date string: ${date}`);
      }
    } else if (date instanceof Date) {
      // If it's a Date object, use directly
      dateObj = date;
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid Date object: ${date}`);
      }
    } else {
      throw new Error(`Unsupported date type: ${typeof date}`);
    }
    
    return format(dateObj, 'yyyy-MM-dd');
  };

  // Helper function to format validation errors for display
  const formatValidationErrors = (errors: Array<{field: string, message: string}>): string => {
    return errors.map(err => t('search.validation.errorFormat', { field: err.field, message: err.message })).join('\n');
  };

  // Mapping function to transform SearchParams to API-compatible format
  const transformToAPIFormat = (searchParams: SearchParams) => {
    // Safe date transformation with proper null checks
    if (!searchParams.dateRange || !searchParams.dateRange.from) {
      throw new Error('Date range is required but missing');
    }

    return {
      origins: searchParams.origins,
      destinations: searchParams.destinations,
      dateRange: {
        from: formatDateForAPI(searchParams.dateRange.from),
        to: searchParams.dateRange?.to ? formatDateForAPI(searchParams.dateRange.to) : undefined
      },
      departureFlex: searchParams.departureFlex,
      returnFlex: searchParams.returnFlex,
      travelClass: searchParams.travelClass,
      adults: searchParams.adults,
      children: searchParams.children,
      infants: searchParams.infants,
      maxResults: searchParams.maxResults,
      nonStop: searchParams.nonStop,
      autoRecommendStopovers: searchParams.autoRecommendStopovers,
      includeNeighboringCountries: searchParams.includeNeighboringCountries
      // Note: stopovers, preferences, constraints are NOT included as they're not in the backend schema
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔍 DEBUGGING: Enhanced validation with detailed logging
    console.log('🔍 Frontend validation starting...');
    console.log('  origins:', params.origins, '(length:', params.origins?.length, ')');
    console.log('  destinations:', params.destinations, '(length:', params.destinations?.length, ')');
    console.log('  dateRange:', params.dateRange);
    console.log('  dateRange.from:', params.dateRange?.from);
    
    // Enhanced validation with better user feedback
    const errors = [];
    
    if (!params.origins || !Array.isArray(params.origins) || params.origins.length === 0) {
      errors.push(t('search.errorOriginRequired'));
    }
    
    if (!params.destinations || !Array.isArray(params.destinations) || params.destinations.length === 0) {
      errors.push(t('search.errorDestinationRequired'));
    }
    
    if (!params.dateRange || !params.dateRange.from) {
      errors.push(t('search.errorDateRequired'));
    } else {
      // Validate dates are not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const departureDate = new Date(params.dateRange.from);
      
      if (departureDate < today) {
        errors.push(t('search.validation.pastDate'));
      }
      
      if (params.dateRange.to && new Date(params.dateRange.to) <= departureDate) {
        errors.push(t('search.validation.returnBeforeDeparture'));
      }
    }
    
    if (errors.length > 0) {
      const errorMessage = t('search.validation.checkSearchPrompt') + '\n\n' + errors.map(err => `• ${err}`).join('\n');
      alert(errorMessage);
      return;
    }
    
    // Additional validation for data types and format
    if (params.origins.some(origin => typeof origin !== 'string' || origin.length < 2)) {
      console.error('❌ Frontend validation failed: Invalid origin codes', params.origins);
      alert(t('search.validation.invalidOriginAirports'));
      return;
    }
    
    if (params.destinations.some(dest => typeof dest !== 'string' || dest.length < 2)) {
      console.error('❌ Frontend validation failed: Invalid destination codes', params.destinations);
      alert(t('search.validation.invalidDestinationAirports'));
      return;
    }
    
    console.log('✅ Frontend validation passed!');
    
    // Generate unique searchId for progress tracking
    const newSearchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSearchId(newSearchId);
    
    setLocalLoading(true);
    setShowProgressModal(true);
    
    console.log('🔍 MODAL DEBUG: Modal should show now - isOpen:', true, 'searchId:', newSearchId);
    
    try {
      // Transform params to API-compatible format (only send fields that backend expects)
      console.log('🔄 Transforming params to API format...');
      const apiParams = {
        ...transformToAPIFormat(params),
        searchId: newSearchId // Include searchId for progress tracking
      };
      
      // 🔍 DEBUGGING: Validate the transformed data before sending
      console.log('🔍 Post-transformation validation:');
      if (!apiParams.origins || apiParams.origins.length === 0) {
        console.error('❌ Post-transformation error: origins is empty!', apiParams.origins);
        alert(t('search.validation.transformationErrorOrigins'));
        return;
      }
      if (!apiParams.destinations || apiParams.destinations.length === 0) {
        console.error('❌ Post-transformation error: destinations is empty!', apiParams.destinations);
        alert(t('search.validation.transformationErrorDestinations'));
        return;
      }
      if (!apiParams.dateRange || !apiParams.dateRange.from) {
        console.error('❌ Post-transformation error: dateRange.from is missing!', apiParams.dateRange);
        alert(t('search.validation.transformationErrorDateRange'));
        return;
      }
      console.log('✅ Post-transformation validation passed!');
      
      // 🔍 DEBUGGING: Add comprehensive logging to understand exactly what we're sending
      console.log('🔄 Sending search request with API-compatible params:');
      console.log('📝 Full apiParams object:', JSON.stringify(apiParams, null, 2));
      console.log('🗂️ Field-by-field breakdown:');
      console.log('  📍 origins:', apiParams.origins, '(type:', typeof apiParams.origins, ', length:', apiParams.origins?.length, ')');
      console.log('  🎯 destinations:', apiParams.destinations, '(type:', typeof apiParams.destinations, ', length:', apiParams.destinations?.length, ')');
      console.log('  📅 dateRange:', apiParams.dateRange, '(type:', typeof apiParams.dateRange, ')');
      console.log('    📅 dateRange.from:', apiParams.dateRange?.from, '(type:', typeof apiParams.dateRange?.from, ')');
      console.log('    📅 dateRange.to:', apiParams.dateRange?.to, '(type:', typeof apiParams.dateRange?.to, ')');
      console.log('  🕐 departureFlex:', apiParams.departureFlex, '(type:', typeof apiParams.departureFlex, ')');
      console.log('  🕑 returnFlex:', apiParams.returnFlex, '(type:', typeof apiParams.returnFlex, ')');
      console.log('  ✈️ travelClass:', apiParams.travelClass, '(type:', typeof apiParams.travelClass, ')');
      console.log('  👥 adults:', apiParams.adults, '(type:', typeof apiParams.adults, ')');
      console.log('  👶 children:', apiParams.children, '(type:', typeof apiParams.children, ')');
      console.log('  🍼 infants:', apiParams.infants, '(type:', typeof apiParams.infants, ')');
      console.log('  📊 maxResults:', apiParams.maxResults, '(type:', typeof apiParams.maxResults, ')');
      console.log('  🚫 nonStop:', apiParams.nonStop, '(type:', typeof apiParams.nonStop, ')');
      console.log('  🎯 autoRecommendStopovers:', apiParams.autoRecommendStopovers, '(type:', typeof apiParams.autoRecommendStopovers, ')');
      console.log('  🗺️ includeNeighboringCountries:', apiParams.includeNeighboringCountries, '(type:', typeof apiParams.includeNeighboringCountries, ')');
      
      // Call our Express API for flight search using Aviationstack
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiParams)
      });

      const data = await response.json();
      
      // 🔍 DEBUGGING: Log the response details
      console.log('📥 Server response status:', response.status);
      console.log('📥 Server response data:', JSON.stringify(data, null, 2));

      // Handle API key missing scenario
      if (data.requiresApiKey) {
        console.log('⚠️ API key required:', data.message);
        
        // Hide progress modal and show user-friendly message about API key setup
        setShowProgressModal(false);
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
        
        // Hide progress modal and pass the real data to the parent component
        setShowProgressModal(false);
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
        console.error('📋 Full error response:', data);
        
        // Handle validation errors specifically
        if (data.error === 'Validation failed' && data.details && Array.isArray(data.details)) {
          console.error('❌ VALIDATION FAILED! Server validation errors:', data.details);
          console.error('📋 Detailed validation breakdown:');
          data.details.forEach((err, index) => {
            console.error(`  ${index + 1}. Field "${err.field}": ${err.message} (code: ${err.code})`);
          });
          
          // Format validation errors for user display
          const formattedErrors = formatValidationErrors(data.details);
          const errorTitle = t('search.errorValidation') || 'Please check your search parameters:';
          console.error('🚨 Showing user error message:', `${errorTitle}\n\n${formattedErrors}`);
          alert(`${errorTitle}\n\n${formattedErrors}`);
          
          // Don't fall back to mock data for validation errors - user needs to fix their input
          return;
        }
        
        // Enhanced user-friendly error messages
        let errorMessage = 'We encountered an issue with your search. Please try again.';
        
        if (data.error?.includes('API')) {
          errorMessage = '⚠️ Search service temporarily unavailable. Please try again in a moment.';
        } else if (data.error?.includes('timeout')) {
          errorMessage = '⏱️ Search is taking longer than expected. Please try again.';
        } else if (data.error?.includes('rate limit')) {
          errorMessage = '🚦 Too many searches. Please wait a moment and try again.';
        } else if (data.error?.includes('network')) {
          errorMessage = '🌐 Network connection issue. Please check your internet and try again.';
        }
        
        alert(errorMessage);
        
        // Hide progress modal and fall back to mock data with error information
        setShowProgressModal(false);
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
      
      // Hide progress modal and fall back to mock data with network error information
      setShowProgressModal(false);
      onSearch({ 
        ...params, 
        realFlightData: null, 
        hasNetworkError: true, 
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        dataSource: 'mock'
      });
    } finally {
      setLocalLoading(false);
      // Note: Don't hide progress modal here - let the modal handle its own lifecycle
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
      
      {/* Search Progress Modal */}
      <SearchProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onCancel={() => {
          setShowProgressModal(false);
          setLocalLoading(false);
          // TODO: Add actual search cancellation logic here if needed
        }}
        searchId={searchId || ''}
      />
    </form>
  );
}