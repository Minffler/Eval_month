'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  max?: number;
  leftLabel?: string;
  rightLabel?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, max = 100, leftLabel, rightLabel, ...props }, ref) => {
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
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (percentage || 0)}%)` }}
      />
      {(leftLabel || rightLabel) && (
          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium text-white mix-blend-difference">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
      )}
    </ProgressPrimitive.Root>
  )
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
