import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

interface RiskMeterProps {
  score: number; // 0-1 where 0 is lowest risk, 1 is highest risk
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function RiskMeter({ 
  score, 
  size = "md", 
  showLabel = true, 
  className 
}: RiskMeterProps) {
  const getRiskLevel = () => {
    if (score <= 0.3) return "low";
    if (score <= 0.6) return "medium";
    return "high";
  };

  const getRiskConfig = () => {
    const level = getRiskLevel();
    switch (level) {
      case "low":
        return {
          label: "Niskie ryzyko",
          color: "text-risk-low",
          bgColor: "bg-risk-low",
          icon: CheckCircle,
          description: "Bezpieczna opcja"
        };
      case "medium":
        return {
          label: "Średnie ryzyko", 
          color: "text-risk-medium",
          bgColor: "bg-risk-medium",
          icon: AlertCircle,
          description: "Wymagana ostrożność"
        };
      case "high":
        return {
          label: "Wysokie ryzyko",
          color: "text-risk-high", 
          bgColor: "bg-risk-high",
          icon: AlertTriangle,
          description: "Tylko dla doświadczonych"
        };
    }
  };

  const config = getRiskConfig();
  const Icon = config.icon;

  const sizeConfig = {
    sm: {
      container: "h-6",
      segment: "h-6",
      icon: "h-3 w-3",
      text: "text-xs"
    },
    md: {
      container: "h-8",
      segment: "h-8", 
      icon: "h-4 w-4",
      text: "text-sm"
    },
    lg: {
      container: "h-10",
      segment: "h-10",
      icon: "h-5 w-5", 
      text: "text-base"
    }
  };

  const currentSize = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Risk meter visualization */}
      <div className={cn("flex rounded-full overflow-hidden bg-muted", currentSize.container)}>
        {/* Low risk segment */}
        <div 
          className={cn(
            "flex-1 transition-opacity",
            currentSize.segment,
            score <= 0.3 ? "bg-risk-low" : "bg-muted opacity-30"
          )}
        />
        {/* Medium risk segment */}
        <div 
          className={cn(
            "flex-1 transition-opacity",
            currentSize.segment,
            score > 0.3 && score <= 0.6 ? "bg-risk-medium" : "bg-muted opacity-30"
          )}
        />
        {/* High risk segment */}
        <div 
          className={cn(
            "flex-1 transition-opacity",
            currentSize.segment,
            score > 0.6 ? "bg-risk-high" : "bg-muted opacity-30"
          )}
        />
      </div>

      {/* Risk label and icon */}
      {showLabel && (
        <div className="flex items-center gap-1">
          <Icon className={cn(currentSize.icon, config.color)} />
          <span className={cn(currentSize.text, "font-medium", config.color)}>
            {config.label}
          </span>
        </div>
      )}
    </div>
  );
}

export function RiskMeterWithTooltip({ 
  score, 
  factors = [], 
  ...props 
}: RiskMeterProps & { 
  factors?: string[] 
}) {
  const config = score <= 0.3 ? "low" : score <= 0.6 ? "medium" : "high";
  
  return (
    <div className="group relative">
      <RiskMeter score={score} {...props} />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg min-w-48">
          <div className="text-sm font-medium mb-2">
            Czynniki ryzyka (wynik: {Math.round(score * 100)}%)
          </div>
          {factors.length > 0 ? (
            <ul className="text-xs text-muted-foreground space-y-1">
              {factors.map((factor, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-warning">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground">
              {config === "low" && "Standardowe połączenia, wystarczające czasy przesiadek"}
              {config === "medium" && "Krótsze przesiadki lub zmiana lotniska"}
              {config === "high" && "Bardzo krótkie przesiadki, samodzielne transfery"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}