'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ApprovalStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<ApprovalStatus, { bgColor: string; textColor: string; label: string }> = {
    '결재중': {
      bgColor: 'bg-[hsl(25,15%,94%)] hover:bg-[hsl(25,15%,90%)]',
      textColor: 'text-[hsl(25,15%,40%)]',
      label: '결재중'
    },
    '현업승인': {
      bgColor: 'bg-[hsl(25,15%,75%)] hover:bg-[hsl(25,15%,70%)]',
      textColor: 'text-[hsl(var(--secondary-foreground))]',
      label: '현업승인'
    },
    '최종승인': {
      bgColor: 'bg-[hsl(25,15%,75%)] hover:bg-[hsl(25,15%,70%)]',
      textColor: 'text-[hsl(var(--secondary-foreground))]',
      label: '최종승인'
    },
    '반려': {
      bgColor: 'bg-[hsl(39,94%,94%)] hover:bg-[hsl(39,94%,90%)]',
      textColor: 'text-[hsl(24,95%,53%)]',
      label: '반려'
    },
  };

  const style = styles[status];

  return (
    <span className={cn(
      'px-2 py-1 rounded-full text-xs font-medium',
      style.bgColor,
      style.textColor,
      className
    )}>
      {style.label}
    </span>
  );
} 