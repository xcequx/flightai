import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Plane, Briefcase, CreditCard, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PriceBreakdownProps {
  price: number;
  segments: number;
  selfTransfer: boolean;
}

export function PriceBreakdown({ price, segments, selfTransfer }: PriceBreakdownProps) {
  const { t } = useTranslation();
  
  // Calculate mock price breakdown
  const baseFare = Math.round(price * 0.65);
  const taxes = Math.round(price * 0.20);
  const baggage = Math.round(price * 0.08);
  const fees = Math.round(price * 0.04);
  const riskPremium = selfTransfer ? Math.round(price * 0.03) : 0;

  const breakdown = [
    {
      label: t('results.priceBreakdown.baseFare'),
      amount: baseFare,
      icon: Plane,
      description: segments > 1 
        ? t('results.priceBreakdown.descriptions.baseFareDescPlural', { count: segments })
        : t('results.priceBreakdown.descriptions.baseFareDesc', { count: segments }),
      isRisk: false,
    },
    {
      label: t('results.priceBreakdown.taxes'),
      amount: taxes, 
      icon: CreditCard,
      description: t('results.priceBreakdown.descriptions.taxesDesc'),
      isRisk: false,
    },
    {
      label: t('results.priceBreakdown.baggage'),
      amount: baggage,
      icon: Briefcase,
      description: t('results.priceBreakdown.descriptions.baggageDesc'),
      isRisk: false,
    },
    {
      label: t('results.priceBreakdown.fees'),
      amount: fees,
      icon: Shield,
      description: t('results.priceBreakdown.descriptions.feesDesc'),
      isRisk: false,
    },
  ];

  if (selfTransfer && riskPremium > 0) {
    breakdown.push({
      label: t('results.priceBreakdown.insurance'),
      amount: riskPremium,
      icon: AlertTriangle,
      description: t('results.priceBreakdown.descriptions.insuranceDesc'),
      isRisk: true,
    });
  }

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="p-4 bg-muted/30 border-0">
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground mb-3">
          {t('results.priceBreakdown.title')}
        </div>
        
        {breakdown.map((item, index) => {
          const Icon = item.icon;
          const isRisk = item.isRisk;
          
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isRisk ? 'text-warning' : 'text-muted-foreground'}`} />
                <div>
                  <div className={`text-sm ${isRisk ? 'text-warning-foreground' : 'text-foreground'}`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </div>
              <div className={`text-sm font-medium ${isRisk ? 'text-warning' : 'text-foreground'}`}>
                {item.amount.toLocaleString('pl-PL')} PLN
              </div>
            </div>
          );
        })}

        <Separator />
        
        <div className="flex items-center justify-between pt-1">
          <div className="text-sm font-semibold">{t('results.priceBreakdown.total')}</div>
          <div className="text-lg font-bold text-primary">
            {total.toLocaleString('pl-PL')} PLN
          </div>
        </div>

        {selfTransfer && (
          <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded text-xs">
            <div className="flex items-start gap-1">
              <AlertTriangle className="h-3 w-3 text-warning mt-0.5" />
              <div dangerouslySetInnerHTML={{ __html: t('results.priceBreakdown.riskPremiumWarning') }} />
            </div>
          </div>
        )}

        <div 
          className="text-xs text-muted-foreground pt-2 border-t border-muted"
          dangerouslySetInnerHTML={{ __html: t('results.priceBreakdown.priceDisclaimer') }}
        />
      </div>
    </Card>
  );
}