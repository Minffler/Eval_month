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
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, max = 100, leftLabel, rightLabel, reverse = false, ...props }, ref) => {
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
        className={cn("h-full w-full flex-1 bg-primary/70 transition-all", reverse ? "origin-right" : "origin-left")}
        style={{ transform: `scaleX(${percentage / 100})` }}
      />
      {(leftLabel || rightLabel) && (
          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium text-foreground">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
      )}
    </ProgressPrimitive.Root>
  )
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
