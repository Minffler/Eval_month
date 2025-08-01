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
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// 슬롯머신 애니메이션 컴포넌트
const SlotMachineNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2000 }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    setIsAnimating(true);
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 이징 함수 (부드러운 감속)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  return (
    <span className={isAnimating ? 'animate-pulse' : ''}>
      {value > 0 ? `${formatCurrency(displayValue)}원` : '- 원'}
    </span>
  );
};

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
    'B+': 'text-black', 
    'B': 'text-black', 
    'B-': 'text-black',
    'C': 'text-black', 
    'C-': 'text-black', 
    'D': 'text-black'
};

export default function DetailedEvaluationView({ allResultsForYear, gradingScale, selectedDate }: DetailedEvaluationViewProps) {
  const { user } = useAuth();
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(true);
  const [isAnnualHistoryOpen, setIsAnnualHistoryOpen] = React.useState(true);



  // 내 현재 월 결과
  const myCurrentMonthResult = React.useMemo(() => 
    allResultsForYear.sort((a,b) => b.month - a.month)[0]
  , [allResultsForYear]);

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  // 연간 성과 히스토리 차트 데이터 생성
  const chartData = React.useMemo(() => {
    const targetYear = selectedDate?.year || new Date().getFullYear();
    const targetMonth = selectedDate?.month || 12;
    
    const yearData = allResultsForYear.filter(r => r.year === targetYear);
    
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      
      if (month > targetMonth) {
        return {
          month: `${month}월`,
          score: null,
          grade: null
        };
      }
      
      const result = yearData.find(r => r.month === month);
      return {
        month: `${month}월`,
        score: result?.score ?? null,
        grade: result?.grade ?? null
      };
    });
  }, [allResultsForYear, selectedDate]);

  return (
    <div className="space-y-4">
      {/* 연간 성과 히스토리 */}
      <Collapsible open={isAnnualHistoryOpen} onOpenChange={setIsAnnualHistoryOpen} asChild>
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
              <div>
                <CardTitle>연간 성과 히스토리</CardTitle>
                <CardDescription>지난 1년간의 월별 성과 추이입니다.</CardDescription>
              </div>
              <Button variant="ghost" size="icon">
                {isAnnualHistoryOpen ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* 라인차트 */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis domain={[0, 150]} fontSize={12} />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">월</span>
                                <span className="font-bold text-muted-foreground">{data.month}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">등급/점수</span>
                                <span className={cn("font-bold", gradeToColor[data.grade] || 'text-foreground')}>
                                  {data.grade ? `${data.grade} (${data.score})` : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}/>
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
              {/* 요약 정보 */}
              {(() => {
                // 실제 데이터가 있는 월만 필터링 (등급이 있는 데이터만)
                const filteredResults = allResultsForYear
                  .filter(result => result.grade !== null)
                  .sort((a,b) => b.month - a.month);
                
                if (filteredResults.length > 0) {
                  return (
                <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">평가 횟수</p>
                          <p className="font-semibold text-[135%]">{filteredResults.length}회</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">평균 점수</p>
                      <p className="font-semibold text-[135%]">
                            {Math.round(filteredResults.reduce((acc, curr) => acc + curr.score, 0) / filteredResults.length)}점
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">평균 근무율</p>
                      <p className="font-semibold text-[135%]">
                            {(filteredResults.reduce((acc, curr) => acc + curr.workRate, 0) / filteredResults.length * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">총 지급액</p>
                      <p className="font-semibold text-primary text-[135%]">
                        <SlotMachineNumber value={filteredResults.reduce((acc, curr) => acc + curr.finalAmount, 0)} duration={2500} />
                      </p>
                    </div>
                  </div>
                </div>
                  );
                } else {
                  return null;
                }
              })()}
              
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
