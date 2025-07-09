'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, LabelList } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { EvaluationResult } from '@/lib/types';

interface AmountDistributionChartProps {
  data: EvaluationResult[];
}

const chartConfig = {
  count: {
    label: '인원수',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function AmountDistributionChart({ data }: AmountDistributionChartProps) {
  const chartData = React.useMemo(() => {
    const ranges = [
      { name: '0', min: 0, max: 0 },
      { name: '1-25만', min: 1, max: 250000 },
      { name: '25-50만', min: 250001, max: 500000 },
      { name: '50-75만', min: 500001, max: 750000 },
      { name: '75-100만', min: 750001, max: 1000000 },
      { name: '100-125만', min: 1000001, max: 1250000 },
      { name: '125-150만', min: 1250001, max: 1500000 },
      { name: '150-175만', min: 1500001, max: 1750000 },
      { name: '175-200만', min: 1750001, max: 2000000 },
      { name: '200-250만', min: 2000001, max: 2500000 },
      { name: '250-300만', min: 2500001, max: 3000000 },
      { name: '300만 이상', min: 3000001, max: Infinity },
    ];

    const distribution = ranges.map(range => ({
      name: range.name,
      count: 0,
    }));

    data.forEach(item => {
      for (let i = 0; i < ranges.length; i++) {
        if (item.finalAmount >= ranges[i].min && item.finalAmount <= ranges[i].max) {
          distribution[i].count++;
          break;
        }
      }
    });
    
    // Find the index of the last range that has data
    const lastIndexWithData = distribution.reduce((maxIdx, item, idx) => {
        return item.count > 0 ? idx : maxIdx;
    }, -1);

    // Show at least 9 bins, and include all bins with data.
    const minBins = 9;
    // We want to show up to one bin beyond the last one with data.
    const requiredBinsForData = lastIndexWithData > -1 ? lastIndexWithData + 2 : 0;
    
    let binsToShow = Math.max(minBins, requiredBinsForData);
    // Don't show more bins than we have defined
    binsToShow = Math.min(binsToShow, ranges.length);
    
    return distribution.slice(0, binsToShow);
  }, [data]);
  
  const totalCount = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);
  
  const processedChartData = chartData.map(item => ({
    ...item,
    percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0
  }));

  const CombinedLabel = (props: any) => {
    const { x, y, width, height, index } = props;
    const item = processedChartData[index];

    if (!item || item.count <= 0) {
      return null;
    }

    const countText = `${item.count}명`;
    const percentageText = `${item.percentage.toFixed(1)}%`;
    
    if (height < 30) {
      return (
        <g>
          <text x={x + width / 2} y={y - 20} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">{countText}</text>
          <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">{percentageText}</text>
        </g>
      );
    }
    
    return (
      <g>
        <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">{countText}</text>
        <text x={x + width / 2} y={y + 14} textAnchor="middle" fontSize={11} fill="hsl(var(--primary-foreground))">{percentageText}</text>
      </g>
    );
  };

  if (data.length === 0) {
    return (
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            데이터가 없습니다.
        </div>
    );
  }

  return (
    <div className="h-[250px]">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer
            data={processedChartData}
            margin={{ top: 30, right: 10, left: 10, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
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
              content={<ChartTooltipContent formatter={(value, name) => <span>{value}명</span>} />}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            >
              <LabelList dataKey="count" content={<CombinedLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
