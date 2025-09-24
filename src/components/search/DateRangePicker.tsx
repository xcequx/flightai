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
  
  // Internal state for temporary selection and popover visibility
  const [tempDateRange, setTempDateRange] = React.useState<DateRange | undefined>(dateRange);
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Update temp state when external dateRange changes
  React.useEffect(() => {
    setTempDateRange(dateRange);
  }, [dateRange]);
  
  // Handle date selection in calendar (temporary)
  const handleDateSelect = (newDateRange: DateRange | undefined) => {
    setTempDateRange(newDateRange);
  };
  
  // Handle confirm button click
  const handleConfirm = () => {
    onChange(tempDateRange);
    setIsOpen(false);
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    setTempDateRange(dateRange);
    setIsOpen(false);
  };
  
  // Check if confirm button should be disabled
  const isConfirmDisabled = !tempDateRange?.from || !tempDateRange?.to;
  
  return (
    <div className="grid gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !dateRange && "text-muted-foreground"
            )}
            data-testid="button-date-picker"
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
        <PopoverContent className="w-auto p-0" align="start" data-testid="popover-date-picker">
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={tempDateRange?.from || dateRange?.from}
              selected={tempDateRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              disabled={(date) => date < new Date()}
              className="pointer-events-auto"
              locale={locale}
              data-testid="calendar-date-picker"
            />
            
            {/* Date range preview */}
            <div className="mt-3 mb-3 text-sm text-center text-muted-foreground" data-testid="text-date-preview">
              {tempDateRange?.from ? (
                tempDateRange.to ? (
                  <>
                    {format(tempDateRange.from, "dd LLL y", { locale })} -{" "}
                    {format(tempDateRange.to, "dd LLL y", { locale })}
                  </>
                ) : (
                  format(tempDateRange.from, "dd LLL y", { locale })
                )
              ) : (
                t('search.dateRange.selectDates')
              )}
            </div>
            
            {/* Confirmation buttons */}
            <div className="flex gap-2 justify-end border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                data-testid="button-cancel-date"
              >
                {t('search.dateRange.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
                data-testid="button-confirm-date"
              >
                {t('search.dateRange.confirm')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}