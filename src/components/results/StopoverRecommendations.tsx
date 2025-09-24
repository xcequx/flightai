import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Coins, TrendingDown } from "lucide-react";

interface StopoverRecommendation {
  hub: string;
  hubCode: string;
  country: string;
  minDays: number;
  maxDays: number;
  savings: number;
  savingsPercent: number;
  totalPrice: number;
  originalPrice: number;
  popularRoutes: string[];
}

interface StopoverRecommendationsProps {
  recommendations: StopoverRecommendation[];
  route: string;
}

export function StopoverRecommendations({ recommendations, route }: StopoverRecommendationsProps) {
  const { t } = useTranslation();
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('results.stopovers.title')}</h3>
        <Badge variant="secondary" className="text-xs">
          {t('results.stopovers.subtitle', { route })}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        {t('results.stopovers.description')}
      </p>

      <div className="grid gap-4">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-base">{rec.hub}</h4>
                  <Badge variant="outline" className="text-xs">
                    {rec.hubCode}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.country}</p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-success">
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-semibold">-{rec.savingsPercent}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('results.stopovers.savings', { amount: rec.savings })} {t('results.stopovers.currency')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t('results.stopovers.days', { min: rec.minDays, max: rec.maxDays })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {rec.totalPrice} {t('results.stopovers.currency')}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground line-through">
                {rec.originalPrice} {t('results.stopovers.currency')}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {rec.popularRoutes.map((airline, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {airline}
                </Badge>
              ))}
            </div>
            
            <div className="mt-3 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
              💡 {t('results.stopovers.spendDays', { min: rec.minDays, max: rec.maxDays, city: rec.hub, amount: rec.savings })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}