import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: string; // YYYY-MM 형식
  onMonthChange: (month: string) => void;
  minMonth?: string;
  maxMonth?: string;
  className?: string;
}

/**
 * 월 선택 컴포넌트
 * 이전/다음 월 이동 및 직접 선택 기능 제공
 */
export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange,
  minMonth,
  maxMonth,
  className = ''
}) => {
  const currentDate = new Date(selectedMonth + '-01');
  
  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const getMonthOptions = () => {
    const options = [];
    const startDate = minMonth ? new Date(minMonth + '-01') : new Date('2020-01-01');
    const endDate = maxMonth ? new Date(maxMonth + '-01') : new Date();
    
    let current = new Date(startDate);
    while (current <= endDate) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      
      options.push({
        value,
        label: formatMonth(current)
      });
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return options.reverse(); // 최신 월부터 표시
  };

  const goToPreviousMonth = () => {
    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!minMonth || prevMonth >= minMonth) {
      onMonthChange(prevMonth);
    }
  };

  const goToNextMonth = () => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!maxMonth || nextMonth <= maxMonth) {
      onMonthChange(nextMonth);
    }
  };

  const isPreviousDisabled = minMonth && selectedMonth <= minMonth;
  const isNextDisabled = maxMonth && selectedMonth >= maxMonth;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousMonth}
        disabled={isPreviousDisabled}
        className="px-2"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="월을 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          {getMonthOptions().map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={goToNextMonth}
        disabled={isNextDisabled}
        className="px-2"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}; 