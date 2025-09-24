import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItineraryCard } from "./ItineraryCard";
import { DollarSign, Clock, Shield, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  }>;
  stopovers: Array<{ city: string; days: number }>;
  selfTransfer: boolean;
  badges: string[];
}

interface ParetoTabsProps {
  results: FlightResult[];
}

export function ParetoTabs({ results }: ParetoTabsProps) {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState("best-mix");

  // Sort results for different tabs
  const sortedResults = {
    cheapest: [...results].sort((a, b) => a.price - b.price),
    fastest: [...results].sort((a, b) => a.totalHours - b.totalHours),
    safest: [...results].sort((a, b) => a.riskScore - b.riskScore),
    "best-mix": [...results].sort((a, b) => {
      // Weighted score: 50% price, 30% time, 20% risk
      const scoreA = (a.price / 2000) * 0.5 + (a.totalHours / 48) * 0.3 + a.riskScore * 0.2;
      const scoreB = (b.price / 2000) * 0.5 + (b.totalHours / 48) * 0.3 + b.riskScore * 0.2;
      return scoreA - scoreB;
    }),
  };

  const tabsConfig = [
    {
      value: "best-mix",
      label: t('results.paretoTabs.bestMix.label'),
      icon: Zap,
      description: t('results.paretoTabs.bestMix.description'),
      color: "text-primary",
    },
    {
      value: "cheapest",
      label: t('results.paretoTabs.cheapest.label'),
      icon: DollarSign,
      description: t('results.paretoTabs.cheapest.description'),
      color: "text-success",
    },
    {
      value: "fastest",
      label: t('results.paretoTabs.fastest.label'),
      icon: Clock,
      description: t('results.paretoTabs.fastest.description'),
      color: "text-primary",
    },
    {
      value: "safest",
      label: t('results.paretoTabs.safest.label'),
      icon: Shield,
      description: t('results.paretoTabs.safest.description'),
      color: "text-warning",
    },
  ];

  return (
    <div>
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs List */}
          <div className="lg:w-80">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-1 lg:h-auto bg-muted/30 p-1">
              {tabsConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="lg:justify-start lg:h-auto lg:p-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Icon className={`h-5 w-5 ${tab.color}`} />
                      <div className="hidden lg:block text-left">
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {tab.description}
                        </div>
                      </div>
                      <div className="lg:hidden text-sm font-medium">
                        {tab.label}
                      </div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Tab Info */}
            <div className="hidden lg:block mt-4 p-4 bg-card rounded-lg border">
              <h4 className="font-medium mb-2">
                {tabsConfig.find(t => t.value === selectedTab)?.label}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {tabsConfig.find(t => t.value === selectedTab)?.description}
              </p>
              <div className="text-xs text-muted-foreground">
                <div>📊 <strong>{results.length}</strong> {t('results.paretoTabs.info.optionsAvailable')}</div>
                <div className="mt-1">
                  💰 {t('results.paretoTabs.info.prices')}: {Math.min(...results.map(r => r.price))} - {Math.max(...results.map(r => r.price))} PLN
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            {tabsConfig.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                <div className="space-y-4">
                  {sortedResults[tab.value as keyof typeof sortedResults].map((result, index) => (
                    <ItineraryCard 
                      key={result.id} 
                      result={result} 
                      rank={index + 1}
                      sortBy={tab.value as 'cheapest' | 'fastest' | 'safest' | 'best-mix'}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
}