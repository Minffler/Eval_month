'use client';

import * as React from 'react';
import type { Approval } from '@/lib/types';

interface ApprovalDataRendererProps {
  approval: Approval;
}

export function ApprovalDataRenderer({ approval }: ApprovalDataRendererProps) {
  const { payload } = approval;
  
  if (payload.dataType === 'shortenedWorkHours') {
    const data = payload.data as any;
    return (
      <div className="space-y-2 text-sm">
        <div><strong>대상자:</strong> {data.name} ({data.uniqueId})</div>
        <div><strong>유형:</strong> {data.type || '단축근로'}</div>
        <div><strong>사용기간:</strong> {data.startDate} ~ {data.endDate}</div>
        <div><strong>근무시간:</strong> {data.startTime} ~ {data.endTime}</div>
      </div>
    );
  } else if (payload.dataType === 'dailyAttendance') {
    const data = payload.data as any;
    return (
      <div className="space-y-2 text-sm">
        <div><strong>대상자:</strong> {data.name} ({data.uniqueId})</div>
        <div><strong>사용일자:</strong> {data.date}</div>
        <div><strong>근태 종류:</strong> {data.type}</div>
      </div>
    );
  }
  
  return (
    <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
      {JSON.stringify(payload.data, null, 2)}
    </pre>
  );
} 