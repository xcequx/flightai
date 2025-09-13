import { Calendar, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface DateFlexibilityProps {
  departureFlex: number;
  returnFlex: number;
  onDepartureFlexChange: (days: number) => void;
  onReturnFlexChange: (days: number) => void;
}

export function DateFlexibility({ 
  departureFlex, 
  returnFlex, 
  onDepartureFlexChange, 
  onReturnFlexChange 
}: DateFlexibilityProps) {
  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium">Elastyczność dat</h4>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Data wylotu ±</label>
            <span className="text-sm font-medium">{departureFlex} dni</span>
          </div>
          <Slider
            value={[departureFlex]}
            onValueChange={(value) => onDepartureFlexChange(value[0])}
            max={14}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Sztywna data</span>
            <span>±2 tygodnie</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Data powrotu ±</label>
            <span className="text-sm font-medium">{returnFlex} dni</span>
          </div>
          <Slider
            value={[returnFlex]}
            onValueChange={(value) => onReturnFlexChange(value[0])}
            max={14}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Sztywna data</span>
            <span>±2 tygodnie</span>
          </div>
        </div>
      </div>

      <div className="mt-3 p-2 bg-info/10 rounded text-xs text-muted-foreground">
        Większa elastyczność dat może znacznie obniżyć cenę biletu
      </div>
    </Card>
  );
}