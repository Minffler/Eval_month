'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/auth-context';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GradeHistogram } from './grade-histogram';
import MyHallOfFame from './my-hall-of-fame';

import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';

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

// 컴포넌트 Props 타입 정의
interface MyPerformanceReviewProps {
  allResultsForYear?: EvaluationResult[];
  allResultsForMonth?: EvaluationResult[]; // 월별 데이터 (전체 분포용)
  selectedDate?: { year: number; month: number };
  gradingScale?: Record<NonNullable<Grade>, GradeInfo>;
}

// 등급별 색상 정의
const gradeToColor: Record<string, string> = {
    'S': 'text-purple-500', 
    'A+': 'text-yellow-500', 
    'A': 'text-yellow-500',
    'B+': 'text-muted-foreground', 
    'B': 'text-muted-foreground', 
    'B-': 'text-muted-foreground',
    'C': 'text-orange-500', 
    'C-': 'text-orange-500', 
    'D': 'text-red-500'
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

// 등급별 응원 문구 매핑
const gradeToMessage: Record<string, string> = {
  'S': `🎉 압도적 성과! 
누구보다 빛나요!`,

  'A+': `🌟 기대 그 이상, 
멋지게 해냈어요!`,

  'A': `✨ 한결같은 실력, 
탁월한 결과입니다!`,
 
  'B+': `👍 성실한 꾸준함이 
빛나는 순간이에요!`,

  'B': `🌱 안정감 있는 퍼포먼스, 
계속 좋아지고 있어요!`,

  'B-': `🛠 보이지 않는 노력이 있어요, 
응원합니다!`,

  'C': `🔁 아직은 성장 중! 
더 좋아질 수 있어요!`,

  'C-': `💡 작은 변화가 
큰 성장을 만듭니다!`,

  'D': `🌱 누구나 어려운 때가 있죠.
다음 달을 기대할게요!`,
};

export default function MyPerformanceReview({ 
  allResultsForYear, 
  allResultsForMonth,
  selectedDate,
  gradingScale
}: MyPerformanceReviewProps) {
  const { user } = useAuth();
  // selectedDate가 없을 경우 기본값 설정 (대시보드 상단에서 선택된 날짜 사용)
  const safeSelectedDate = selectedDate || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  // 컴포넌트 상태: 카드의 열림/닫힘 상태 관리
    const [isMonthlyReviewOpen, setIsMonthlyReviewOpen] = React.useState(true);
    const [isAnnualHistoryOpen, setIsAnnualHistoryOpen] = React.useState(true);
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    
  // 피평가자 ID별 데이터 필터링 (전체 연간 데이터에서)
  const myResults = React.useMemo(() => {
    if (!user?.uniqueId || !allResultsForYear) return [];
    return allResultsForYear.filter(result => result.uniqueId === user.uniqueId);
  }, [allResultsForYear, user?.uniqueId]);
  
  // 전체 등급 분포 계산 - 선택된 월의 데이터만 사용 (전체 데이터)
  const gradeDistribution = React.useMemo(() => {
    if (!selectedDate) return [];
    
    // 선택된 월의 데이터만 필터링 (전체 데이터) - 월별 데이터 사용
    const monthlyData = (allResultsForMonth || []).filter(result => 
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

  // 연간 성과 히스토리 차트 데이터 생성 (피평가자 ID별)
  const chartData = React.useMemo(() => {
    const targetYear = selectedDate?.year || new Date().getFullYear();
    const targetMonth = selectedDate?.month || 12;
    
    const yearData = myResults.filter(r => r.year === targetYear);
    
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
  }, [myResults, selectedDate]);
  
  // 필요한 데이터 추출 및 조건부 변수 설정
  // selectedDate의 월을 기준으로 해당 월의 결과를 찾음 (피평가자 ID별) - 월별 데이터에서 찾기
  const latestResult = React.useMemo(() => {
    if (!selectedDate || !user?.uniqueId) return null;
    
    const targetMonth = selectedDate.month;
    const result = (allResultsForMonth || []).find(r => 
      r.month === targetMonth && r.uniqueId === user.uniqueId
    );
    
    return result || null;
  }, [allResultsForMonth, selectedDate, user?.uniqueId]);
  
  // 최고 등급 여부 확인 (S, A+, A)
  const isTopTier = latestResult?.grade && ['S', 'A+', 'A'].includes(latestResult.grade);
  // 낮은 등급 여부 확인 (C, C-, D)
  const isLowTier = latestResult?.grade && ['C', 'C-', 'D'].includes(latestResult.grade);

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  // 콘페티 효과 함수
  const triggerConfetti = React.useCallback(() => {
    if (!latestResult?.grade) return;

    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // S 등급: 화려한 다색 콘페티
    if (latestResult.grade === 'S') {
      const duration = 2 * 1000;
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
      const end = Date.now() + (2 * 1000);
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
    
    // 전체 월별 데이터에서 해당 월의 모든 평가 결과를 가져옴
    const monthlyData = (allResultsForMonth || []).filter(result => 
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
  }, [latestResult, allResultsForMonth, selectedDate, gradingScale]);

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
                  <div className="flex items-center gap-2">
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
                        {latestResult.grade && gradeToMessage[latestResult.grade] && (
                          <p className={cn(
                            "mt-1 font-semibold whitespace-pre-line",
                            isTopTier ? "text-primary" : "text-muted-foreground"
                          )}>
                            {gradeToMessage[latestResult.grade]}
                          </p>
                        )}
                        
                        {/* 위치 정보 */}
                        {myPosition && (
                          <div className="mt-3 text-center">
                            <p className="text-sm text-muted-foreground">총 평가 인원 {myPosition.totalCount}명 중</p>
                            <p className="text-sm text-muted-foreground">
                              {myPosition.totalCount > 0 ? `상위 ${myPosition.topPercent.toFixed(1)}%` : '상위 - %'}
                            </p>
                          </div>
                        )}
                                        </div>
                                    </motion.div>
                    
                    {/* 우측: 등급분포차트 (음영 없음) */}
                    {gradingScale && (
                      <div className="flex-1 h-79">
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

      {/* 2. 나의 명예의 전당 */}
      <MyHallOfFame 
        allResultsForYear={allResultsForYear || []}
      />

      {/* 3. 연간 성과 히스토리 (피평가자 ID별) */}
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

      {/* 4. 월별 상세 결과 (피평가자 ID별) */}
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
          
          {/* 요약 정보 - 항상 표시 */}
          <CardContent className="p-4 pb-0">
            {(() => {
              // 실제 데이터가 있는 월만 필터링 (등급이 있는 데이터만) - 전체 연간 데이터에서 피평가자 ID별 필터링
              const filteredResults = (allResultsForYear || [])
                .filter(result => result.grade !== null && result.uniqueId === user?.uniqueId)
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
          </CardContent>
          
          <CollapsibleContent>
            <CardContent className="p-4 pt-0">
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
                      // 실제 데이터가 있는 월만 필터링 (등급이 있는 데이터만) - 전체 연간 데이터에서 피평가자 ID별 필터링
                      const filteredResults = (allResultsForYear || [])
                        .filter(result => result.grade !== null && result.uniqueId === user?.uniqueId)
                        .sort((a,b) => b.month - a.month);
                      
                      if (filteredResults.length > 0) {
                        return filteredResults.map((result) => (
                      <TableRow key={`${result.uniqueId}-${result.year}-${result.month}`} className="hover:bg-muted/50">
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
