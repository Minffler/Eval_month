'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { gradingScale } from '@/lib/data';

interface GradeHistogramProps {
  data: { name: string; value: number }[];
  title?: string;
  description?: string;
}

const chartConfig = {
  value: {
    label: '인원수',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function GradeHistogram({
  data,
  title = '등급 분포',
  description
}: GradeHistogramProps) {

  const tableData = (Object.keys(gradingScale) as (keyof typeof gradingScale)[])
    .map(grade => {
        const count = data.find(d => d.name === grade)?.value || 0;
        return {
            grade,
            score: gradingScale[grade].score,
            count
        }
    });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        <div className="h-[250px] -ml-4">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart accessibilityLayer data={data} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
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
                    <LabelList dataKey="value" position="top" offset={5} fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="text-center font-bold">등급</TableHead>
                        {tableData.map(d => <TableCell key={d.grade} className="text-center font-bold text-primary">{d.grade}</TableCell>)}
                    </TableRow>
                    <TableRow>
                        <TableHead className="text-center">점수</TableHead>
                        {tableData.map(d => <TableCell key={d.grade} className="text-center">{d.score}</TableCell>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableHead className="text-center">인원</TableHead>
                        {tableData.map(d => <TableCell key={d.grade} className="text-center font-medium">{d.count}</TableCell>)}
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
