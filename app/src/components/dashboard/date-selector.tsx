'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {
  const [_isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Get date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const handlePresetClick = (date: string) => {
    onDateChange(date);
    setIsCalendarOpen(false);
  };

  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    if (newDate) {
      onDateChange(newDate);
    }
  };



  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Date:</span>
      
      {/* Quick preset buttons */}
      <div className="flex gap-2">
        <Button
          variant={selectedDate === today ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(today)}
        >
          Today
        </Button>
        
        <Button
          variant={selectedDate === yesterdayStr ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(yesterdayStr)}
        >
          Yesterday
        </Button>
        
        <Button
          variant={selectedDate === sevenDaysAgoStr ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(sevenDaysAgoStr)}
        >
          Last 7 Days
        </Button>
      </div>

      {/* Date picker input */}
      <div className="relative">
        <Input
          type="date"
          value={selectedDate}
          onChange={handleDateInputChange}
          className="w-40"
          max={today} // Prevent selecting future dates
        />
      </div>


    </div>
  );
};

export default DateSelector;

