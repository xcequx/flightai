import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Plane, 
  Search, 
  MapPin, 
  Brain, 
  CheckCircle, 
  XCircle, 
  Loader2,
  X,
  Clock
} from "lucide-react";

interface ProgressEvent {
  type: string;
  step: string;
  percentage: number;
  current: number;
  total: number;
  message: string;
  details?: string;
  timestamp: string;
}

interface SearchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  searchId: string;
}

export function SearchProgressModal({ 
  isOpen, 
  onClose, 
  onCancel, 
  searchId 
}: SearchProgressModalProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Progress step configuration with icons and colors
  const progressSteps = [
    {
      step: 'initialization',
      icon: Search,
      label: t('search.progress.initialization', 'Starting flight search...'),
      color: 'text-blue-500'
    },
    {
      step: 'airport_expansion',
      icon: MapPin,
      label: t('search.progress.airportExpansion', 'Analyzing flight routes...'),
      color: 'text-green-500'
    },
    {
      step: 'flexible_dates_start',
      icon: Plane,
      label: t('search.progress.flexibleDatesStart', 'Searching date combinations...'),
      color: 'text-purple-500'
    },
    {
      step: 'date_search',
      icon: Plane,
      label: t('search.progress.dateSearch', 'Searching dates...'),
      color: 'text-purple-500'
    },
    {
      step: 'flexible_dates_complete',
      icon: CheckCircle,
      label: t('search.progress.flexibleDatesComplete', 'Comparing prices...'),
      color: 'text-orange-500'
    },
    {
      step: 'ai_analysis_start',
      icon: Brain,
      label: t('search.progress.aiAnalysisStart', 'Generating AI recommendations...'),
      color: 'text-indigo-500'
    },
    {
      step: 'ai_analysis_complete',
      icon: Brain,
      label: t('search.progress.aiAnalysisComplete', 'AI analysis completed'),
      color: 'text-indigo-500'
    },
    {
      step: 'complete',
      icon: CheckCircle,
      label: t('search.progress.complete', 'Search completed!'),
      color: 'text-green-600'
    },
    {
      step: 'error',
      icon: XCircle,
      label: t('search.progress.error', 'Search failed'),
      color: 'text-red-500'
    }
  ];

  // Calculate estimated time remaining
  useEffect(() => {
    if (progress && startTime && progress.percentage > 0 && progress.percentage < 100) {
      const elapsed = (new Date().getTime() - startTime.getTime()) / 1000; // seconds
      const estimatedTotal = (elapsed / progress.percentage) * 100;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      setEstimatedTimeRemaining(remaining);
    }
  }, [progress, startTime]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return t('search.progress.timeRemaining.seconds', { seconds: Math.round(seconds) });
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return t('search.progress.timeRemaining.minutes', { 
        minutes, 
        seconds: remainingSeconds 
      });
    }
  };

  // Connect to SSE endpoint
  const connectToProgressStream = useCallback(() => {
    if (!searchId) return;

    console.log(`📡 Connecting to progress stream for search ${searchId}`);
    setStartTime(new Date());
    setError(null);

    const eventSource = new EventSource(`/api/flights/progress/${searchId}`);

    eventSource.onopen = () => {
      console.log(`📡 SSE connection opened for search ${searchId}`);
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        console.log(`📡 Progress update received:`, data);
        
        if (data.type === 'connected') {
          setIsConnected(true);
        } else if (data.type === 'progress') {
          setProgress(data);
          
          // Auto-close modal when search completes successfully
          if (data.step === 'complete' && data.percentage === 100) {
            setTimeout(() => {
              onClose();
              eventSource.close();
            }, 2000); // Show completion message for 2 seconds
          }
          
          // Handle error step
          if (data.step === 'error') {
            setError(data.details || data.message);
            setTimeout(() => {
              eventSource.close();
            }, 5000); // Keep error visible for 5 seconds
          }
        }
      } catch (err) {
        console.error('📡 Error parsing SSE data:', err, 'Raw data:', event.data);
      }
    };

    eventSource.onerror = (event) => {
      console.error(`📡 SSE connection error for search ${searchId}:`, event);
      setError(t('search.progress.connectionError', 'Connection error. Please try again.'));
      setIsConnected(false);
      eventSource.close();
    };

    return eventSource;
  }, [searchId, onClose, t]);

  // Effect to establish SSE connection when modal opens
  useEffect(() => {
    if (isOpen && searchId) {
      const eventSource = connectToProgressStream();
      
      return () => {
        if (eventSource) {
          console.log(`📡 Closing SSE connection for search ${searchId}`);
          eventSource.close();
        }
        setProgress(null);
        setIsConnected(false);
        setError(null);
        setStartTime(null);
        setEstimatedTimeRemaining(null);
      };
    }
  }, [isOpen, searchId, connectToProgressStream]);

  // Get current step configuration
  const currentStepConfig = progressSteps.find(step => step.step === progress?.step) || progressSteps[0];
  const CurrentIcon = currentStepConfig.icon;

  // Handle cancel action
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="search-progress-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            {t('search.progress.title', 'Searching Flights')}
          </DialogTitle>
        </DialogHeader>

        <Card className="p-6">
          {/* Connection Status */}
          {!isConnected && !error && (
            <div className="flex items-center justify-center gap-2 mb-4 p-4 bg-muted/30 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                {t('search.progress.connecting', 'Connecting to search...')}
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Progress Display */}
          {progress && isConnected && (
            <div className="space-y-6">
              {/* Current Step */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-muted ${currentStepConfig.color}`}>
                  <CurrentIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">
                    {progress.message}
                  </h3>
                  {progress.details && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {progress.details}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {t('search.progress.progressLabel', 'Progress')}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(progress.percentage)}%
                  </span>
                </div>
                <Progress 
                  value={progress.percentage} 
                  className="h-3" 
                  data-testid="progress-bar"
                />
              </div>

              {/* Progress Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {t('search.progress.currentStep', 'Step')}:
                  </span>
                  <span className="font-medium">
                    {progress.current}/{progress.total}
                  </span>
                </div>
                
                {estimatedTimeRemaining !== null && progress.percentage > 10 && progress.percentage < 95 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatTimeRemaining(estimatedTimeRemaining)}
                    </span>
                  </div>
                )}
              </div>

              {/* Completion Message */}
              {progress.step === 'complete' && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    {t('search.progress.completionMessage', 'Redirecting to results...')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            {progress?.step !== 'complete' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                data-testid="button-cancel-search"
              >
                <X className="h-4 w-4 mr-2" />
                {t('search.progress.cancel', 'Cancel')}
              </Button>
            )}
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}