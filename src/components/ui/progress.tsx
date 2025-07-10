'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  max?: number;
  leftLabel?: string;
  rightLabel?: string;
  /**
   * Whether to reverse the fill direction of the progress bar.
   * Default is false (fills from left). True fills from right.
   */
  reverse?: boolean;
  indicatorClassName?: string;
}

const formatNumber = (numStr: string | undefined): string => {
  if (numStr === undefined) return '';
  const num = parseFloat(numStr);
  if (isNaN(num)) return numStr;
  // Show decimals only if they are not .00
  if (num % 1 !== 0) {
    return num.toFixed(2);
  }
  return String(Math.floor(num));
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, max = 100, leftLabel, rightLabel, reverse = false, indicatorClassName, ...props }, ref) => {
  const percentage = (value && max) ? (value / max) * 100 : 0;
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-5 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", indicatorClassName)}
        style={{ transform: `translateX(${percentage}%)` }}
      />
      {(leftLabel || rightLabel) && (
          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium text-foreground">
            <span>{formatNumber(leftLabel)}</span>
            <span>{formatNumber(rightLabel)}</span>
          </div>
      )}
    </ProgressPrimitive.Root>
  )
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
