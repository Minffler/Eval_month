'use client';

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Grade, GradeInfo } from '@/lib/types';

interface GradeHistogramMemoizedProps {
  data: Array<{ name: string; value: number }>;
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

const GradeHistogramMemoized = React.memo<GradeHistogramMemoizedProps>(({
  data,
  gradingScale,
}) => {
  const totalCount = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  const sortedData = React.useMemo(() => 
    [...data]
    .filter(d => {
      const grade = d.name as Grade;
      return grade && gradingScale[grade] !== undefined;
    })
    .sort((a,b) => {
      const gradeA = a.name as Grade;
      const gradeB = b.name as Grade;
      const scoreA = (gradeA && gradingScale[gradeA]?.score) ?? -1;
      const scoreB = (gradeB && gradingScale[gradeB]?.score) ?? -1;
      return scoreB - scoreA;
    })
    .map(item => ({
        ...item,
        percentage: totalCount > 0 ? (item.value / totalCount) * 100 : 0,
    })),
    [data, gradingScale, totalCount]
  );
  
  const CombinedLabel = React.useCallback((props: any) => {
    const { x, y, width, height, index } = props;
    const item = sortedData[index];

    if (!item || item.value <= 0) {
      return null;
    }

    const countText = item.value;
    const percentageText = `${item.percentage.toFixed(1)}%`;

    // If the bar is too short, render both labels above the bar
    if (height < 30) {
      return (
        <g>
          {/* Count label (higher up) */}
          <text x={x + width / 2} y={y - 20} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">
            {countText}
          </text>
          {/* Percentage label (closer to bar) */}
          <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">
            {percentageText}
          </text>
        </g>
      );
    }

    // If the bar is tall enough, render count above and percentage inside
    return (
      <g>
        {/* Count label */}
        <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">
          {countText}
        </text>
        {/* Percentage label */}
        <text x={x + width / 2} y={y + 14} textAnchor="middle" fontSize={11} fill="hsl(var(--primary-foreground))">
          {percentageText}
        </text>
      </g>
    );
  }, [sortedData]);

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value: number, name: string) => [
            `${value}명 (${((value / totalCount) * 100).toFixed(1)}%)`, 
            '인원수'
          ]}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" label={<CombinedLabel />} />
      </BarChart>
    </ResponsiveContainer>
  );
});

GradeHistogramMemoized.displayName = 'GradeHistogramMemoized';

export default GradeHistogramMemoized; 