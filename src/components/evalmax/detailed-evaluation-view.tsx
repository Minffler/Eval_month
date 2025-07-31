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
import { cn } from '@/lib/utils';

interface DetailedEvaluationViewProps {
  allResultsForYear: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate?: { year: number; month: number };
}

// 등급별 색상 정의
const gradeToColor: Record<string, string> = {
    'S': 'text-purple-500', 
    'A+': 'text-yellow-500', 
    'A': 'text-yellow-500',
    'B+': 'text-orange-700', 
    'B': 'text-lime-500', 
    'B-': 'text-yellow-600',
    'C': 'text-orange-500', 
    'C-': 'text-red-500', 
    'D': 'text-gray-500'
};

export default function DetailedEvaluationView({ allResultsForYear, gradingScale, selectedDate }: DetailedEvaluationViewProps) {
  const { user } = useAuth();
  const [isDistributionOpen, setIsDistributionOpen] = React.useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(true);

  // 전체 등급 분포 데이터 생성
  const gradeDistribution = React.useMemo(() => {
    const counts = allResultsForYear.reduce((acc, result) => {
      if (result.grade) {
        acc[result.grade] = (acc[result.grade] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(gradingScale || {}).map((grade) => ({
      name: grade,
      value: counts[grade] || 0,
    }));
  }, [allResultsForYear, gradingScale]);

  // 내 현재 월 결과
  const myCurrentMonthResult = React.useMemo(() => 
    allResultsForYear.sort((a,b) => b.month - a.month)[0]
  , [allResultsForYear]);

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  return (
    <div className="space-y-4">
      {/* 전체 등급 분포 */}
      <Collapsible open={isDistributionOpen} onOpenChange={setIsDistributionOpen} asChild>
        <Card className="shadow-sm border-gray-200">
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer p-4">
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
            <CardContent className="p-4">
              <GradeHistogram 
                data={gradeDistribution} 
                gradingScale={gradingScale}
                highlightAll={true}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* 월별 상세 결과 */}
      <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen} asChild>
        <Card className="shadow-sm border-gray-200">
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer p-4">
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
            <CardContent className="p-4">
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
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
                    {(() => {
                      // 실제 데이터가 있는 월만 필터링 (등급이 있는 데이터만)
                      const filteredResults = allResultsForYear
                        .filter(result => result.grade !== null)
                        .sort((a,b) => b.month - a.month);
                      
                      if (filteredResults.length > 0) {
                        return filteredResults.map((result) => (
                      <TableRow key={result.month} className="hover:bg-muted/50">
                        <TableCell className="text-center font-medium">{result.month}월</TableCell>
                        <TableCell className="text-center">{result.company}</TableCell>
                        <TableCell className="text-center">{result.department}</TableCell>
                        <TableCell className="text-center">{result.title}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            result.workRate >= 0.9 ? "bg-green-100 text-green-800" :
                            result.workRate >= 0.8 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {(result.workRate * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-bold",
                            gradeToColor[result.grade || ''] || 'bg-gray-100 text-gray-800'
                          )}>
                            {result.grade}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{result.score}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(result.baseAmount)}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{formatCurrency(result.finalAmount)}</TableCell>
                        <TableCell className="text-center text-sm">{result.evaluatorName}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{result.memo || '-'}</TableCell>
                      </TableRow>
                        ));
                      } else {
                        return (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                          아직 {new Date().getFullYear()}년 평가 결과가 없습니다.
                        </TableCell>
                      </TableRow>
                        );
                      }
                    })()}
                  </TableBody>
                </Table>
              </div>
              
              {/* 요약 정보 */}
              {(() => {
                // 실제 데이터가 있는 월만 필터링 (등급이 있는 데이터만)
                const filteredResults = allResultsForYear
                  .filter(result => result.grade !== null)
                  .sort((a,b) => b.month - a.month);
                
                if (filteredResults.length > 0) {
                  return (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">평가 횟수</p>
                          <p className="font-semibold">{filteredResults.length}회</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">평균 점수</p>
                      <p className="font-semibold">
                            {Math.round(filteredResults.reduce((acc, curr) => acc + curr.score, 0) / filteredResults.length)}점
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">평균 근무율</p>
                      <p className="font-semibold">
                            {(filteredResults.reduce((acc, curr) => acc + curr.workRate, 0) / filteredResults.length * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">총 지급액</p>
                      <p className="font-semibold text-primary">
                            {filteredResults.reduce((acc, curr) => acc + curr.finalAmount, 0).toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
                  );
                } else {
                  return null;
                }
              })()}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
