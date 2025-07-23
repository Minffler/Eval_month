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
  highlightGrade?: Grade | null;
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

    if (!grade || !gradingScale || !gradingScale[grade]) {
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
  highlightGrade,
}: GradeHistogramProps) {

  const totalCount = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  // 핵심: 모든 등급을 포함하도록 데이터 생성 (값이 0이어도 포함)
  const sortedData = React.useMemo(() => {
    // 1. 모든 등급에 대해 기본 데이터 생성 (값이 0이어도 포함)
    const allGradesData = Object.keys(gradingScale || {}).map(grade => {
      const existingData = data.find(d => d.name === grade);
      return {
        name: grade,
        value: existingData ? existingData.value : 0,
      };
    });

    // 2. 점수 기준으로 정렬
    return allGradesData
      .sort((a, b) => {
        const gradeA = a.name as Grade;
        const gradeB = b.name as Grade;
        const scoreA = (gradingScale && gradeA && gradingScale[gradeA]?.score) ?? -1;
        const scoreB = (gradingScale && gradeB && gradingScale[gradeB]?.score) ?? -1;
        return scoreB - scoreA;
      })
      .map(item => ({
        ...item,
        percentage: totalCount > 0 ? (item.value / totalCount) * 100 : 0,
      }));
  }, [data, gradingScale, totalCount]);
  
  const CombinedLabel = (props: any) => {
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
  };

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
              <LabelList dataKey="value" content={<CombinedLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
