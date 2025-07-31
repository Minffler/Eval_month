'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GradeHistogram } from './grade-histogram';

import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';

// 컴포넌트 Props 타입 정의
interface MyPerformanceReviewProps {
  allResultsForYear?: EvaluationResult[];
  selectedDate?: { year: number; month: number };
  gradingScale?: Record<NonNullable<Grade>, GradeInfo>;
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

// 등급별 배경색 정의
const gradeToBgColor: Record<string, string> = {
  'S': 'bg-purple-50 border-purple-200', 
  'A+': 'bg-yellow-50 border-yellow-200', 
  'A': 'bg-yellow-50 border-yellow-200',
  'B+': 'bg-orange-50 border-orange-200', 
  'B': 'bg-lime-50 border-lime-200', 
  'B-': 'bg-yellow-50 border-yellow-200',
  'C': 'bg-orange-50 border-orange-200', 
  'C-': 'bg-red-50 border-red-200', 
  'D': 'bg-gray-50 border-gray-200'
};

export default function MyPerformanceReview({ 
  allResultsForYear, 
  selectedDate,
  gradingScale
}: MyPerformanceReviewProps) {
  // selectedDate가 없을 경우 기본값 설정 (대시보드 상단에서 선택된 날짜 사용)
  const safeSelectedDate = selectedDate || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  // 컴포넌트 상태: 카드의 열림/닫힘 상태 관리
    const [isMonthlyReviewOpen, setIsMonthlyReviewOpen] = React.useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(true);

    // 데이터 가공: 원본 데이터를 차트 라이브러리가 사용할 수 있는 형태로 변환
  // 1월~12월까지 모두 표시하되, 데이터가 없는 월은 null로 처리
  // selectedDate의 월까지만 표시하도록 제한
  const chartData = React.useMemo(() => {
    const targetYear = selectedDate?.year || new Date().getFullYear();
    const targetMonth = selectedDate?.month || 12; // 기본값은 12월
    
    // 해당 연도의 데이터만 필터링하고, 선택된 월까지만 표시
    const yearData = (allResultsForYear || []).filter(r => r.year === targetYear);
    
    return Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
      
      // 선택된 월을 초과하는 경우 null로 처리
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
  
  // 전체 등급 분포 계산 - 선택된 월의 데이터만 사용
  const gradeDistribution = React.useMemo(() => {
    if (!selectedDate) return [];
    
    // 선택된 월의 데이터만 필터링
    const monthlyData = (allResultsForYear || []).filter(result => 
      result.year === selectedDate.year && result.month === selectedDate.month
    );
    
    const counts = monthlyData.reduce((acc, result) => {
      if (result.grade) {
        acc[result.grade] = (acc[result.grade] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(gradeToColor).map((grade) => ({
      name: grade,
      value: counts[grade] || 0,
    }));
  }, [allResultsForYear, selectedDate]);
  
  // 필요한 데이터 추출 및 조건부 변수 설정
  // selectedDate의 월을 기준으로 해당 월의 결과를 찾음
  const latestResult = React.useMemo(() => {
    if (!selectedDate) return null;
    
    const targetMonth = selectedDate.month;
    const result = (allResultsForYear || []).find(r => r.month === targetMonth);
    
    return result || null;
  }, [allResultsForYear, selectedDate]);
  
  // 최고 등급 여부 확인 (S, A+, A)
  const isTopTier = latestResult?.grade && ['S', 'A+', 'A'].includes(latestResult.grade);
  // 낮은 등급 여부 확인 (C, C-, D)
  const isLowTier = latestResult?.grade && ['C', 'C-', 'D'].includes(latestResult.grade);

  // 콘페티 효과 함수
  const triggerConfetti = React.useCallback(() => {
    if (!latestResult?.grade) return;

    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // S 등급: 화려한 다색 콘페티
    if (latestResult.grade === 'S') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      
      // 다양한 색상의 콘페티
      const colors = ['#8b5cf6', '#a855f7', '#c084fc', '#fbbf24', '#f59e0b', '#ef4444', '#10b981'];
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        
        const particleCount = 300 * (timeLeft / duration);
        
        // 여러 방향에서 발사
        confetti({ 
          ...defaults, 
          particleCount, 
          colors,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
        });
        confetti({ 
          ...defaults, 
          particleCount, 
          colors,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
        });
        confetti({ 
          ...defaults, 
          particleCount: particleCount * 0.5, 
          colors,
          origin: { x: 0.5, y: Math.random() - 0.2 } 
        });
      }, 200);
    }
    
    // A+, A 등급: 노랑/주황 계열 콘페티
    else if (latestResult.grade === 'A+' || latestResult.grade === 'A') {
      const end = Date.now() + (2.5 * 1000);
      const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FF7F50', '#FF6347', '#FBBF24', '#F59E0B'];
      
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        confetti({ particleCount: 2, angle: 90, spread: 45, origin: { x: 0.5 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [latestResult]);

  // 최고 등급일 때 자동으로 콘페티 실행
  React.useEffect(() => {
    if (latestResult?.grade && ['S', 'A+', 'A'].includes(latestResult.grade)) {
      // 약간의 지연 후 콘페티 실행
      const timer = setTimeout(() => {
        triggerConfetti();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [latestResult, triggerConfetti]);

  // 나의 위치 계산 (상위 퍼센트)
  const myPosition = React.useMemo(() => {
    if (!latestResult || !gradingScale) return null;
    
    const monthlyData = (allResultsForYear || []).filter(result => 
      result.year === selectedDate?.year && result.month === selectedDate?.month
    );
    
    if (monthlyData.length === 0) return null;
    
    // 현재 사용자의 등급 이상을 받은 인원수 계산
    const currentGradeScore = gradingScale[latestResult.grade!]?.score || 0;
    const sameOrHigherGradeCount = monthlyData.filter(result => {
      const resultGradeScore = gradingScale[result.grade!]?.score || 0;
      return resultGradeScore >= currentGradeScore;
    }).length;
    
    const totalCount = monthlyData.filter(r => r.grade && r.score).length;
    const topPercent = (sameOrHigherGradeCount / totalCount) * 100;
    
    return {
      totalCount,
      topPercent: Math.round(topPercent * 10) / 10
    };
  }, [latestResult, allResultsForYear, selectedDate, gradingScale]);

    return (
    <div className="space-y-6">
      {/* 1. 월별 성과 리뷰 카드 */}
      <Collapsible open={isMonthlyReviewOpen} onOpenChange={setIsMonthlyReviewOpen} asChild>
        <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                            <div>
                <CardTitle>월별 성과 리뷰</CardTitle>
                <CardDescription>{selectedDate?.year}년 {selectedDate?.month}월 평가 결과입니다.</CardDescription>
                            </div>
              <Button variant="ghost" size="icon">{isMonthlyReviewOpen ? <ChevronUp /> : <ChevronDown />}</Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="space-y-6">
              {/* 6월 평가 결과와 등급분포차트 */}
                            <AnimatePresence>
                {latestResult && (
                  <div className="flex items-center gap-6">
                    {/* 좌측: 등급 표시 영역 (음영 적용) */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                      className="relative p-4 rounded-lg bg-muted/50 overflow-hidden min-w-[200px]"
                    >
                      <div className="text-center cursor-pointer" onClick={triggerConfetti}>
                        <p className="text-sm text-muted-foreground">{latestResult.month}월 평가 결과</p>
                        <p className={cn("text-5xl font-bold", gradeToColor[latestResult.grade!] || 'text-foreground')}>
                          {latestResult.grade}
                        </p>
                        {isTopTier && <p className="mt-1 font-semibold text-primary">훌륭해요! 최고의 성과입니다!</p>}
                        {isLowTier && <p className="mt-1 font-semibold text-muted-foreground">다음 달엔 더 잘할 수 있어요!</p>}
                        
                        {/* 위치 정보 */}
                        {myPosition && (
                          <div className="mt-3 text-center">
                            <p className="text-sm text-muted-foreground">총 평가 인원 {myPosition.totalCount}명 중</p>
                            <p className="text-sm text-muted-foreground">상위 {myPosition.topPercent.toFixed(1)}%</p>
                                            </div>
                                            )}
                                        </div>
                                    </motion.div>
                    
                    {/* 우측: 등급분포차트 (음영 없음) */}
                    {gradingScale && (
                      <div className="flex-1 h-56">
                        <GradeHistogram 
                          data={gradeDistribution} 
                          gradingScale={gradingScale}
                          highlightGrade={latestResult?.grade}
                        />
                      </div>
                    )}
                  </div>
                                )}
                            </AnimatePresence>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 2. 연간 성과 히스토리 카드 */}
      <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} asChild>
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
              <div>
                <CardTitle>연간 성과 히스토리</CardTitle>
                <CardDescription>지난 1년간의 월별 성과 추이입니다.</CardDescription>
              </div>
              <Button variant="ghost" size="icon">{isHistoryOpen ? <ChevronUp /> : <ChevronDown />}</Button>
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
                              <div className="flex flex-col"><span className="text-[0.70rem] uppercase text-muted-foreground">월</span><span className="font-bold text-muted-foreground">{data.month}</span></div>
                              <div className="flex flex-col"><span className="text-[0.70rem] uppercase text-muted-foreground">등급/점수</span><span className={cn("font-bold", gradeToColor[data.grade] || 'text-foreground')}>{data.grade ? `${data.grade} (${data.score})` : '-'}</span></div>
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
        </div>
    );
}
