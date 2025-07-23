'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, isValid, parse } from 'date-fns';
import { cn } from '@/lib/utils';

interface DatePickerWithInputProps {
  value: string;
  onChange: (date?: string) => void;
  disabled?: boolean;
}

export const DatePickerWithInput = ({ value, onChange, disabled }: DatePickerWithInputProps) => {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  );
  const [inputValue, setInputValue] = React.useState<string>(value || '');
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    if (value && isValid(parse(value, 'yyyy-MM-dd', new Date()))) {
      setDate(parse(value, 'yyyy-MM-dd', new Date()));
      setInputValue(value);
    } else if (!value) {
      setDate(undefined);
      setInputValue('');
    }
  }, [value]);

  const handleDateSelect = React.useCallback((selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      setInputValue(formattedDate);
      onChange(formattedDate);
    } else {
      setInputValue('');
      onChange(undefined);
    }
    setPopoverOpen(false);
  }, [onChange]);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value.replace(/[^0-9]/g, '');
    if (text.length > 4) text = `${text.slice(0, 4)}-${text.slice(4)}`;
    if (text.length > 7) text = `${text.slice(0, 7)}-${text.slice(7)}`;
    setInputValue(text.slice(0, 10));
  }, []);

  const handleInputBlur = React.useCallback(() => {
    const parsedDate = parse(inputValue, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      const formattedDate = format(parsedDate, 'yyyy-MM-dd');
      if (inputValue !== formattedDate) {
        setInputValue(formattedDate);
      }
      setDate(parsedDate);
      onChange(formattedDate);
    } else if (inputValue === '') {
      setDate(undefined);
      onChange(undefined);
    }
  }, [inputValue, onChange]);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="YYYY-MM-DD"
        className="w-full"
        disabled={disabled}
      />
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>날짜 선택</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}

export const TimePicker = ({ value, onChange, disabled }: TimePickerProps) => {
  const [hour, minute] = value.split(':').map(Number);

  const handleTimeChange = React.useCallback((part: 'hour' | 'minute', partValue: string) => {
    const numValue = parseInt(partValue, 10);
    if (isNaN(numValue)) return;

    let newHour = hour || 0;
    let newMinute = minute || 0;

    if (part === 'hour') {
      if (numValue >= 0 && numValue <= 23) {
        newHour = numValue;
      }
    } else if (part === 'minute') {
      if (numValue >= 0 && numValue <= 59) {
        newMinute = numValue;
      }
    }

    const newTime = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    onChange(newTime);
  }, [hour, minute, onChange]);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        max="23"
        value={hour || ''}
        onChange={(e) => handleTimeChange('hour', e.target.value)}
        className="w-16 text-center"
        disabled={disabled}
      />
      <span className="text-muted-foreground">:</span>
      <Input
        type="number"
        min="0"
        max="59"
        value={minute || ''}
        onChange={(e) => handleTimeChange('minute', e.target.value)}
        className="w-16 text-center"
        disabled={disabled}
      />
    </div>
  );
}; 