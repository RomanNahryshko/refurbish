'use client';

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import dayjs from 'dayjs';
import "react-day-picker/dist/style.css";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "../ui/calendar";

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
  // Use selectedRange directly instead of local state to avoid infinite loops
  const handleSelect = (range: DateRange | undefined) => {
    onRangeChange(range);
  };

  // Quick preset functions using dayjs
  const setToday = () => {
    const today = dayjs().startOf('day').toDate();
    handleSelect({ from: today, to: today });
  };

  const setYesterday = () => {
    const yesterday = dayjs().subtract(1, 'day').startOf('day').toDate();
    handleSelect({ from: yesterday, to: yesterday });
  };

  const setLast7Days = () => {
    const end = dayjs().endOf('day').toDate();
    const start = dayjs().subtract(6, 'day').startOf('day').toDate();
    handleSelect({ from: start, to: end });
  };

  const setLast30Days = () => {
    const end = dayjs().endOf('day').toDate();
    const start = dayjs().subtract(29, 'day').startOf('day').toDate();
    handleSelect({ from: start, to: end });
  };

  const setThisMonth = () => {
    const start = dayjs().startOf('month').toDate();
    const end = dayjs().endOf('month').toDate();
    handleSelect({ from: start, to: end });
  };

  const setLastMonth = () => {
    const start = dayjs().subtract(1, 'month').startOf('month').toDate();
    const end = dayjs().subtract(1, 'month').endOf('month').toDate();
    handleSelect({ from: start, to: end });
  };

  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      {/* Quick preset buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={setToday}
          className="h-8 px-3 text-xs font-medium"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setYesterday}
          className="h-8 px-3 text-xs font-medium"
        >
          Yesterday
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setLast7Days}
          className="h-8 px-3 text-xs font-medium"
        >
          Last 7 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setLast30Days}
          className="h-8 px-3 text-xs font-medium"
        >
          Last 30 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setThisMonth}
          className="h-8 px-3 text-xs font-medium"
        >
          This Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setLastMonth}
          className="h-8 px-3 text-xs font-medium"
        >
          Last Month
        </Button>
      </div>

      {/* Date range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal h-9",
              !selectedRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRange?.from ? (
              selectedRange.to ? (
                <>
                  {format(selectedRange.from, "MMM dd, yyyy")} -{" "}
                  {format(selectedRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                format(selectedRange.from, "MMM dd, yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={selectedRange?.from}
              selected={selectedRange}
              onSelect={handleSelect}
              numberOfMonths={2}
              pagedNavigation={false}
              disabled={(date) => {
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return date > today || date < new Date("2023-01-01");
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
