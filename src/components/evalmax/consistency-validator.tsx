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
  selectedDate?: { year: number; month: number };
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

export function ConsistencyValidator({ results, gradingScale, selectedDate }: ConsistencyValidatorProps) {
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<ValidateGradeConsistencyOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setReport(null);
    setError(null);

    try {
      // 데이터가 충분한지 확인
      if (results.length === 0) {
        throw new Error("분석할 평가 데이터가 없습니다.");
      }

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

      // 평가자가 충분한지 확인
      const evaluators = Object.keys(gradeDataByEvaluator);
      if (evaluators.length < 2) {
        throw new Error("분석을 위해서는 최소 2명 이상의 평가자 데이터가 필요합니다.");
      }

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
      setError(error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.');
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
    .filter(d => {
      const grade = d.grade as Grade;
      return grade && gradingScale[grade] !== undefined;
    })
    .sort((a,b) => {
        const gradeA = a.grade as Grade;
        const gradeB = b.grade as Grade;
        const scoreA = gradeA && gradingScale[gradeA] ? gradingScale[gradeA].score : -1;
        const scoreB = gradeB && gradingScale[gradeB] ? gradingScale[gradeB].score : -1;
        return scoreA - scoreB; // D(0점) → S(150점) 순서로 변경
    })
    .map(item => ({
        name: item.grade,
        value: item.count,
        percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
    }));
  }, [report, gradingScale]);

  const CombinedLabel = (props: any) => {
    const { x, y, width, height, index } = props;
    const item = chartData[index];

    if (!item || item.value <= 0) {
      return null;
    }

    const countText = item.value;
    const percentageText = `${item.percentage.toFixed(1)}%`;

    if (height < 30) {
      return (
        <g>
          <text x={x + width / 2} y={y - 20} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">
            {countText}
          </text>
          <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">
            {percentageText}
          </text>
        </g>
      );
    }

    return (
      <g>
        <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">
          {countText}
        </text>
        <text x={x + width / 2} y={y + 14} textAnchor="middle" fontSize={11} fill="hsl(var(--primary-foreground))">
          {percentageText}
        </text>
      </g>
    );
  };


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
              아래 버튼을 클릭하면 {selectedDate ? `${selectedDate.year}년 ${selectedDate.month}월` : '현재'} 평가 데이터를 사용하여 평가자 간 등급 부여의 일관성을 검토합니다. AI는 각 평가자의 등급 분포를 비교하여 유난히 관대하거나 엄격한 평가 경향이 있는지, 특정 그룹에 대한 편향이 있는지 등을 분석합니다.
            </p>
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">오류: {error}</p>
              </div>
            )}
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
                <div className="h-[250px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        accessibilityLayer
                        data={chartData}
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
