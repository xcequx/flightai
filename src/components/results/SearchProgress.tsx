import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Plane, Search, Zap, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchProgressProps {
  progress: number;
}


export function SearchProgress({ progress }: SearchProgressProps) {
  const { t } = useTranslation();
  
  const searchSteps = [
    { icon: Search, label: t('results.searchProgress.steps.analyzing'), threshold: 10 },
    { icon: Plane, label: t('results.searchProgress.steps.searching'), threshold: 30 },
    { icon: Zap, label: t('results.searchProgress.steps.optimizing'), threshold: 60 },
    { icon: CheckCircle, label: t('results.searchProgress.steps.finalizing'), threshold: 90 },
  ];
  
  const currentStep = searchSteps.findIndex(step => progress < step.threshold);
  const activeStepIndex = currentStep === -1 ? searchSteps.length - 1 : Math.max(0, currentStep - 1);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Plane className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {t('results.searchProgress.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('results.searchProgress.description')}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">{t('results.searchProgress.progressLabel')}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="space-y-4">
          {searchSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = progress >= step.threshold;
            const isActive = index === activeStepIndex;
            
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/5 border border-primary/20"
                    : isCompleted
                    ? "bg-success/5 border border-success/20"
                    : "bg-muted/30"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isCompleted
                      ? "bg-success text-success-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground animate-pulse"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    isCompleted || isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {isCompleted && (
                  <CheckCircle className="h-4 w-4 text-success ml-auto" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>{t('results.searchProgress.tipTitle')}</strong> {t('results.searchProgress.tipText')}
          </p>
        </div>
      </Card>
    </div>
  );
}