'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { validateGradeConsistency, type ValidateGradeConsistencyOutput } from '@/ai/flows/grade-consistency-validation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import type { EvaluationResult } from '@/lib/types';

interface ConsistencyValidatorProps {
  results: EvaluationResult[];
}

export function ConsistencyValidator({ results }: ConsistencyValidatorProps) {
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

      const gradeDataString = JSON.stringify(gradeDataByEvaluator, null, 2);

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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>등급</TableHead>
                      <TableHead className="text-right">인원 (명)</TableHead>
                      <TableHead className="text-right">비율 (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.overallDistribution.map((item) => (
                      <TableRow key={item.grade}>
                        <TableCell className="font-medium">{item.grade}</TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                        <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">주요 발견 사항</h3>
                <div className="space-y-3">
                  {report.findings.length > 0 ? (
                    report.findings.map((finding, index) => (
                      <div key={index} className="p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getBadgeVariant(finding.type)}>{finding.type}</Badge>
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
