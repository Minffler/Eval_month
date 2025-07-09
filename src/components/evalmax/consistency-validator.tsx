'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { validateGradeConsistency, type ValidateGradeConsistencyOutput } from '@/ai/flows/grade-consistency-validation';
import { Badge } from '../ui/badge';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, LabelList } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface ConsistencyValidatorProps {
  results: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

const chartConfig = {
  value: {
    label: '인원수',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const CustomYAxisTick = (props: any) => {
    const { x, y, payload, gradingScale } = props;
    const grade = payload.value as Grade;

    if (!grade || !gradingScale[grade]) {
        return null;
    }
    
    const score = gradingScale[grade].score;

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dx={-4} textAnchor="end" fill="hsl(var(--foreground))" fontSize={12} fontWeight="500">
                {grade}
            </text>
            <text x={0} y={0} dy={14} dx={-4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={11}>
                ({score}점)
            </text>
        </g>
    );
};

export function ConsistencyValidator({ results, gradingScale }: ConsistencyValidatorProps) {
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<ValidateGradeConsistencyOutput | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setReport(null);

    try {
      const gradeDataByEvaluator = results.reduce((acc, result) => {
        const evaluator = result.evaluatorName || 'N/A';
        if (!acc[evaluator]) {
          acc[evaluator] = [];
        }
        if (result.grade) {
          acc[evaluator].push(result.grade);
        }
        return acc;
      }, {} as Record<string, string[]>);

      const gradeDataString = Object.entries(gradeDataByEvaluator)
        .map(([evaluator, grades]) => `${evaluator}: ${grades.join(', ')}`)
        .join('\n');

      const expectedDistribution =
        '대부분의 직원은 B 또는 B+ 등급을 받아야 하며, S 또는 D 등급을 받는 직원은 소수여야 합니다. 등급 분포는 평가자 간에 비교적 균등해야 하며, 특정 평가자가 유독 후하거나 박한 점수를 주는 경향이 없어야 합니다.';
      
      const analysisResult = await validateGradeConsistency({
        gradeData: gradeDataString,
        expectedDistribution,
      });
      setReport(analysisResult);
    } catch (error) {
      console.error('Error validating consistency:', error);
    } finally {
      setLoading(false);
    }
  }

  const getBadgeVariant = (type: '편향' | '불일치' | '긍정적 발견'): 'destructive' | 'secondary' | 'default' => {
    switch (type) {
      case '편향':
      case '불일치':
        return 'destructive';
      case '긍정적 발견':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const chartData = React.useMemo(() => {
    if (!report) return [];
    const totalCount = report.overallDistribution.reduce((acc, curr) => acc + curr.count, 0);
    return [...report.overallDistribution]
    .filter(d => gradingScale[d.grade as Grade] !== undefined)
    .sort((a,b) => {
        const scoreA = gradingScale[a.grade as Grade]?.score ?? -1;
        const scoreB = gradingScale[b.grade as Grade]?.score ?? -1;
        return scoreB - scoreA;
    })
    .map(item => ({
        name: item.grade,
        value: item.count,
        percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
    }));
}, [report, gradingScale]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">등급 일관성 분석</CardTitle>
          <CardDescription>
            AI를 사용하여 현재 데이터 기반으로 평가자별 등급 분포를 분석하고 잠재적 편향을 식별합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
              아래 버튼을 클릭하면 현재 월의 전체 평가 데이터를 사용하여 평가자 간 등급 부여의 일관성을 검토합니다. AI는 각 평가자의 등급 분포를 비교하여 유난히 관대하거나 엄격한 평가 경향이 있는지, 특정 그룹에 대한 편향이 있는지 등을 분석합니다.
            </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalyze} disabled={loading || results.length === 0} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            AI로 평가자별 편향 검토하기
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">AI 일관성 리포트</CardTitle>
          <CardDescription>
            생성된 리포트가 아래에 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-none space-y-4 rounded-md border p-4 min-h-[400px]">
          {loading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {report ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">요약</h3>
                <p className="text-sm text-muted-foreground">{report.summary}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">전체 등급 분포</h3>
                <div className="h-[220px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        accessibilityLayer
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <XAxis
                          type="number"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={<CustomYAxisTick gradingScale={gradingScale} />}
                          width={80}
                          interval={0}
                        />
                        <ChartTooltip
                          cursor={{ fill: 'hsl(var(--muted))' }}
                          content={<ChartTooltipContent />}
                        />
                        <Bar
                          dataKey="value"
                          fill="var(--color-value)"
                          radius={[0, 4, 4, 0]}
                          layout="vertical"
                        >
                            <LabelList dataKey="value" position="right" offset={5} fontSize={12} formatter={(value: number) => value > 0 ? value : ''} />
                            <LabelList 
                                dataKey="percentage" 
                                position="insideRight"
                                offset={4}
                                fill="hsl(var(--primary-foreground))"
                                fontSize={11}
                                formatter={(value: number) => value > 0 ? `${value.toFixed(1)}%` : ''}
                            />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">주요 발견 사항</h3>
                <div className="space-y-3">
                  {report.findings.length > 0 ? (
                    report.findings.map((finding, index) => (
                      <div key={index} className="p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getBadgeVariant(finding.type)} className="whitespace-nowrap">{finding.type}</Badge>
                          <p className="font-semibold text-sm">{finding.description}</p>
                        </div>
                        <p className="text-xs text-muted-foreground pl-2 border-l-2 ml-1.5">{finding.evidence}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">특별한 발견 사항이 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          ) : !loading && <p className="text-muted-foreground text-center pt-16">리포트가 여기에 생성됩니다...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
