'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthSelectorProps {
  selectedDate: { year: number; month: number };
  onDateChange: (date: { year: number; month: number }) => void;
}

const getRecentMonths = () => {
  const dates: { year: number; month: number }[] = [];
  const today = new Date();
  for (let i = 0; i < 24; i++) {
    // Start from last month
    const date = new Date(today.getFullYear(), today.getMonth() - 1 - i, 1);
    dates.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
  }
  return dates;
};

export function MonthSelector({ selectedDate, onDateChange }: MonthSelectorProps) {
  const recentMonths = getRecentMonths();
  
  if (!recentMonths.find(d => d.year === selectedDate.year && d.month === selectedDate.month)) {
    // Add to the list and sort it
    recentMonths.push(selectedDate);
    recentMonths.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });
  }

  const selectedValue = `${selectedDate.year}-${selectedDate.month}`;

  const handleValueChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    onDateChange({ year, month });
  };

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-auto min-w-[150px]">
        <SelectValue placeholder="평가월 선택" />
      </SelectTrigger>
      <SelectContent>
        {recentMonths.map(({ year, month }) => (
          <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
            {year}년 {month}월
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
