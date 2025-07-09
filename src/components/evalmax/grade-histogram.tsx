'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, LabelList } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { Grade, GradeInfo } from '@/lib/types';

interface GradeHistogramProps {
  data: { name: string; value: number }[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

const chartConfig = {
  value: {
    label: '인원수',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const CustomXAxisTick = (props: any) => {
    const { x, y, payload, gradingScale } = props;
    const grade = payload.value as Grade;

    if (!grade || !gradingScale[grade]) {
        return null;
    }
    
    const score = gradingScale[grade].score;

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={12} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={12} fontWeight="500">
                {grade}
            </text>
            <text x={0} y={0} dy={26} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={11}>
                ({score}점)
            </text>
        </g>
    );
};

export function GradeHistogram({
  data,
  gradingScale,
}: GradeHistogramProps) {

  const totalCount = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  const sortedData = React.useMemo(() => 
    [...data]
    .filter(d => gradingScale[d.name as Grade] !== undefined)
    .sort((a,b) => {
      const scoreA = gradingScale[a.name as Grade]?.score ?? -1;
      const scoreB = gradingScale[b.name as Grade]?.score ?? -1;
      return scoreB - scoreA;
    })
    .map(item => ({
        ...item,
        percentage: totalCount > 0 ? (item.value / totalCount) * 100 : 0,
    })),
    [data, gradingScale, totalCount]
  );


  return (
    <div className="h-[250px]">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer
            data={sortedData}
            margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
          >
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={<CustomXAxisTick gradingScale={gradingScale} />}
              height={40}
              interval={0}
            />
            <YAxis
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[4, 4, 0, 0]}
            >
                <LabelList dataKey="value" position="top" offset={5} fontSize={12} formatter={(value: number) => value > 0 ? value : ''} />
                <LabelList 
                    dataKey="percentage" 
                    position="insideTop"
                    offset={10}
                    fill="hsl(var(--primary-foreground))"
                    fontSize={11}
                    formatter={(value: number) => value > 0 ? `${value.toFixed(1)}%` : ''}
                />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
