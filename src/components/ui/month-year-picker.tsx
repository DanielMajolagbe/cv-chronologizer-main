import * as React from "react";
import { format, addMonths, addYears, setMonth, setYear } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthYearPickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MonthYearPicker({
  date,
  setDate,
  className,
  placeholder = "Select month/year",
  disabled = false,
}: MonthYearPickerProps) {
  // Initial state will be current date if no date is provided
  const [viewDate, setViewDate] = React.useState<Date>(date || new Date());
  
  // Months array for dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Handle month change
  const handleMonthChange = (monthIndex: number) => {
    const newDate = setMonth(viewDate, monthIndex);
    setViewDate(newDate);
    if (date) {
      setDate(setMonth(date, monthIndex));
    } else {
      setDate(newDate);
    }
  };

  // Handle year change
  const changeYear = (amount: number) => {
    const newDate = addYears(viewDate, amount);
    setViewDate(newDate);
    if (date) {
      setDate(addYears(date, amount));
    } else {
      setDate(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex flex-col space-y-4">
          {/* Year selector */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeYear(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(viewDate, "yyyy")}
            </span>
            <Button
              variant="outline" 
              size="icon"
              onClick={() => changeYear(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <Button
                key={month}
                variant={viewDate.getMonth() === index ? "default" : "outline"}
                className="text-sm"
                onClick={() => handleMonthChange(index)}
              >
                {month.substring(0, 3)}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 