import * as React from "react";
import { format, addMonths, setMonth, setYear, addYears } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Define the props interface for the DatePicker component
interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

// DatePicker component with month, year, and day selection
export function DatePicker({
  date,
  setDate,
  className,
  placeholder = "DD/MM/YYYY",
  disabled = false,
}: DatePickerProps) {
  // Initialize viewDate with the provided date or the current date
  const [viewDate, setViewDate] = React.useState<Date>(date || new Date());

  // Array of months for the dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Array of years (e.g., from 2000 to 2030)
  const years = Array.from({ length: 80 }, (_, i) => 1950 + i);

  // Handle month change
  const handleMonthChange = (monthIndex: number) => {
    const newDate = setMonth(viewDate, monthIndex);
    setViewDate(newDate);
    if (date) {
      setDate(setMonth(date, monthIndex));
    }
  };

  // Handle year change
  const handleYearChange = (year: number) => {
    const newDate = setYear(viewDate, year);
    setViewDate(newDate);
    if (date) {
      setDate(setYear(date, year));
    }
  };

  // Handle day selection
  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setDate(newDate);
  };

  // Navigate to previous/next month
  const changeMonth = (amount: number) => {
    const newDate = addMonths(viewDate, amount);
    setViewDate(newDate);
    if (date) {
      setDate(addMonths(date, amount));
    }
  };

  // Get the days in the current month
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

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
          {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex flex-col space-y-4">
          {/* Month and Year selector */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex space-x-2">
              <div>
                <label className="text-sm font-medium">Month:</label>
                <select
                  value={months[viewDate.getMonth()]}
                  onChange={(e) => handleMonthChange(months.indexOf(e.target.value))}
                  className="ml-2 border rounded p-1"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Year:</label>
                <select
                  value={viewDate.getFullYear()}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="ml-2 border rounded p-1"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days of the week */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} />
            ))}
            {daysArray.map((day) => (
              <Button
                key={day}
                variant={
                  date &&
                  date.getDate() === day &&
                  date.getMonth() === viewDate.getMonth() &&
                  date.getFullYear() === viewDate.getFullYear()
                    ? "default"
                    : "outline"
                }
                className="text-sm"
                onClick={() => handleDayClick(day)}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// MonthYearPicker component - only for month and year selection
export function MonthYearPicker({
  date,
  setDate,
  className,
  placeholder = "Select month/year",
  disabled = false,
}: DatePickerProps) {
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
      // If no date is selected yet, create a new one based on the view date
      // Set the day to 1 since we only care about month and year
      const newDateWithDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setDate(newDateWithDay);
    }
  };

  // Handle year change
  const changeYear = (amount: number) => {
    const newDate = addYears(viewDate, amount);
    setViewDate(newDate);
    if (date) {
      setDate(addYears(date, amount));
    } else {
      // If no date is selected yet, create a new one based on the view date
      // Set the day to 1 since we only care about month and year
      const newDateWithDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setDate(newDateWithDay);
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
          {date ? format(date, "MMMM yyyy") : <span>{placeholder}</span>}
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
                variant={
                  date && date.getMonth() === index && date.getFullYear() === viewDate.getFullYear()
                    ? "default"
                    : "outline"
                }
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