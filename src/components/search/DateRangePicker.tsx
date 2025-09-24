import * as React from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onChange: (dateRange: DateRange | undefined) => void;
  placeholder?: string;
}

export function DateRangePicker({ dateRange, onChange, placeholder }: DateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pl' ? pl : enUS;
  const defaultPlaceholder = placeholder || t('search.dateRange.placeholder');
  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd LLL y", { locale })} -{" "}
                  {format(dateRange.to, "dd LLL y", { locale })}
                </>
              ) : (
                format(dateRange.from, "dd LLL y", { locale })
              )
            ) : (
              <span>{defaultPlaceholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onChange}
            numberOfMonths={2}
            disabled={(date) => date < new Date()}
            className="p-3 pointer-events-auto"
            locale={locale}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}