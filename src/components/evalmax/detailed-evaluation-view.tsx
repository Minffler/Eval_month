'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GradeHistogram } from './grade-histogram';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useAuth } from '@/contexts/auth-context';

interface DetailedEvaluationViewProps {
  allResultsForYear: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

export default function DetailedEvaluationView({ allResultsForYear, gradingScale }: DetailedEvaluationViewProps) {
  const { user } = useAuth();
  const [isDistributionOpen, setIsDistributionOpen] = React.useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(true);

  const gradeDistribution = React.useMemo(() => {
    const counts = allResultsForYear.reduce((acc, result) => {
      if (result.grade) {
        acc[result.grade] = (acc[result.grade] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(gradingScale).map((grade) => ({
      name: grade,
      value: counts[grade] || 0,
    }));
  }, [allResultsForYear, gradingScale]);

  const myCurrentMonthResult = allResultsForYear.sort((a,b) => b.month - a.month)[0];

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  return (
    <div className="space-y-6">
      <Collapsible open={isDistributionOpen} onOpenChange={setIsDistributionOpen} asChild>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
              <div>
                <CardTitle>전체 등급 분포</CardTitle>
                <CardDescription>전체 평가 대상자 중 나의 등급 위치를 확인합니다.</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                {isDistributionOpen ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <GradeHistogram 
                data={gradeDistribution} 
                gradingScale={gradingScale}
                highlightGrade={myCurrentMonthResult?.grade}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen} asChild>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
              <div>
                <CardTitle>월별 상세 결과</CardTitle>
                <CardDescription>연간 월별 상세 평가 결과입니다.</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                {isDetailsOpen ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">평가월</TableHead>
                      <TableHead className="text-center">회사</TableHead>
                      <TableHead className="text-center">소속부서</TableHead>
                      <TableHead className="text-center">직책</TableHead>
                      <TableHead className="text-center">근무율</TableHead>
                      <TableHead className="text-center">등급</TableHead>
                      <TableHead className="text-center">점수</TableHead>
                      <TableHead className="text-center">기준금액</TableHead>
                      <TableHead className="text-center">지급금액</TableHead>
                      <TableHead className="text-center">평가자</TableHead>
                      <TableHead className="text-center">비고</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allResultsForYear.length > 0 ? allResultsForYear.sort((a,b) => b.month - a.month).map((result) => (
                      <TableRow key={result.month}>
                        <TableCell className="text-center">{result.month}월</TableCell>
                        <TableCell className="text-center">{result.company}</TableCell>
                        <TableCell className="text-center">{result.department}</TableCell>
                        <TableCell className="text-center">{result.title}</TableCell>
                        <TableCell className="text-center">{(result.workRate * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-center font-semibold">{result.grade}</TableCell>
                        <TableCell className="text-center">{result.score}</TableCell>
                        <TableCell className="text-right">{formatCurrency(result.baseAmount)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(result.finalAmount)}</TableCell>
                        <TableCell className="text-center">{result.evaluatorName}</TableCell>
                        <TableCell>{result.memo}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          아직 {new Date().getFullYear()}년 평가 결과가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
