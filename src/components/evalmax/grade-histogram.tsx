'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, LabelList, CartesianGrid, Cell } from 'recharts';
import type { Grade, GradeInfo } from '@/lib/types';

interface GradeHistogramProps {
  data: { name: string; value: number }[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  highlightGrade?: Grade | null;
}

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

  // 모든 등급을 포함하도록 데이터 생성 (값이 0이어도 포함)
  const sortedData = React.useMemo(() => {
    // 1. 모든 등급에 대해 기본 데이터 생성 (값이 0이어도 포함)
    const allGradesData = Object.keys(gradingScale || {}).map(grade => {
      const existingData = data.find(d => d.name === grade);
      return {
        name: grade,
        value: existingData ? existingData.value : 0,
      };
    });

    // 2. 점수 기준으로 정렬 (D → S 순서)
    return allGradesData
      .sort((a, b) => {
        const gradeA = a.name as Grade;
        const gradeB = b.name as Grade;
        const scoreA = (gradingScale && gradeA && gradingScale[gradeA]?.score) ?? -1;
        const scoreB = (gradingScale && gradeB && gradingScale[gradeB]?.score) ?? -1;
        return scoreA - scoreB; // 낮은 점수부터 높은 점수 순서로 변경
      })
      .map(item => ({
        ...item,
        percentage: totalCount > 0 ? (item.value / totalCount) * 100 : 0,
        isHighlighted: item.name === highlightGrade,
      }));
  }, [data, gradingScale, totalCount, highlightGrade]);
  
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
            <div className="h-[250px] bg-[hsl(30,30%,98%)]">
        <ResponsiveContainer width="100%" height="100%" style={{ backgroundColor: 'white', background: 'white' }}>
                                  <BarChart
              accessibilityLayer
              data={sortedData}
              margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
              style={{ backgroundColor: 'white', background: 'white' }}
            >
              <CartesianGrid strokeDasharray="0" stroke="transparent" />
              <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={<CustomXAxisTick gradingScale={gradingScale} />}
              height={40}
              interval={0}
              style={{ backgroundColor: 'white' }}
            />
            <YAxis
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              allowDecimals={false}
              style={{ backgroundColor: 'white' }}
            />
            <Bar
              dataKey="value"
            fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            >
            {sortedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isHighlighted ? "#f97316" : "hsl(var(--primary))"} 
                stroke={entry.isHighlighted ? "#ea580c" : "transparent"}
                strokeWidth={entry.isHighlighted ? 2 : 0}
              />
            ))}
              <LabelList dataKey="value" content={<CombinedLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      
      {/* 하이라이트된 등급에 대한 설명 */}
      {highlightGrade && (
        <div className="mt-2 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
            주황색 막대: 내 등급 ({highlightGrade})
          </p>
        </div>
      )}
    </div>
  );
}
