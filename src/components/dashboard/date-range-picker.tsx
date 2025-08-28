'use client';

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  selectedRange: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  selectedRange,
  onRangeChange,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(selectedRange);

  React.useEffect(() => {
    setDate(selectedRange);
  }, [selectedRange]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onRangeChange(range);
  };

  // Quick preset functions
  const setToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    handleSelect({ from: today, to: today });
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    handleSelect({ from: yesterday, to: yesterday });
  };

  const setLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    handleSelect({ from: start, to: end });
  };

  const setLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    handleSelect({ from: start, to: end });
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    handleSelect({ from: start, to: end });
  };

  const setLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
    handleSelect({ from: start, to: end });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Quick preset buttons */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={setToday}
          className="h-8 px-3 text-xs"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setYesterday}
          className="h-8 px-3 text-xs"
        >
          Yesterday
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setLast7Days}
          className="h-8 px-3 text-xs"
        >
          Last 7 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setLast30Days}
          className="h-8 px-3 text-xs"
        >
          Last 30 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setThisMonth}
          className="h-8 px-3 text-xs"
        >
          This Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setLastMonth}
          className="h-8 px-3 text-xs"
        >
          Last Month
        </Button>
      </div>

      {/* Date range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal h-8",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "MMM dd, yyyy")} -{" "}
                  {format(date.to, "MMM dd, yyyy")}
                </>
              ) : (
                format(date.from, "MMM dd, yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(date) => {
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              return date > today || date < new Date("2023-01-01");
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
