'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Award, Trophy, PiggyBank, Sparkles } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface MyPerformanceReviewProps {
  allResultsForYear: EvaluationResult[];
  allResultsForMonth: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

// 등급별 색상 정의: UI의 핵심 요소입니다.
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

const badgeInfo: Record<string, {label: string, icon: React.ElementType, color: string}> = {
    'S': { label: 'Platinum', icon: Award, color: 'text-purple-500' },
    'A+': { label: 'Gold', icon: Award, color: 'text-yellow-500' },
    'A': { label: 'Silver', icon: Award, color: 'text-gray-500' },
    'B+': { label: 'Bronze', icon: Award, color: 'text-orange-600' },
};

export default function MyPerformanceReview({ allResultsForYear, allResultsForMonth, gradingScale }: MyPerformanceReviewProps) {
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(true);
    const [isPiggyBankOpen, setIsPiggyBankOpen] = React.useState(true);
    const [isHallOfFameOpen, setIsHallOfFameOpen] = React.useState(true);

    

    // 연간 누적 성과급 계산
    const annualCumulativeBonus = React.useMemo(() =>
        allResultsForYear.reduce((acc, curr) => acc + curr.finalAmount, 0)
    , [allResultsForYear]);
    
    // 차트 데이터 생성: 원본 데이터를 recharts가 사용할 수 있는 형태로 변환합니다.
    const chartData = React.useMemo(() => 
        Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const result = allResultsForYear.find(r => r.month === month);
            return {
                month: `${month}월`,
                score: result?.score ?? null, // 점수가 없으면 null 처리하여 차트 선이 끊어지게 함
                grade: result?.grade ?? null
            };
        })
    , [allResultsForYear]);

    // 현재 선택된 월의 평가 결과 (상단의 평가년월에 해당하는 결과)
    const currentMonthResult = React.useMemo(() => {
        // allResultsForMonth에서 현재 사용자의 결과를 찾음
        // 이는 상단에서 선택된 월(6월)의 평가 결과
        return allResultsForMonth.find(r => r.uniqueId === allResultsForYear[0]?.uniqueId);
    }, [allResultsForMonth, allResultsForYear]);

    // 동기 부여 메시지를 위한 조건부 로직
    const isTopTier = React.useMemo(() => 
        currentMonthResult?.grade && ['S', 'A+', 'A'].includes(currentMonthResult.grade)
    , [currentMonthResult]);

    const isLowTier = React.useMemo(() => 
        currentMonthResult?.grade && ['C', 'C-', 'D'].includes(currentMonthResult.grade)
    , [currentMonthResult]);

    // 획득한 뱃지 목록
    const acquiredBadges = React.useMemo(() => 
        allResultsForYear
            .filter(r => r.grade && ['S', 'A+', 'A', 'B+'].includes(r.grade))
            .map(r => ({ month: r.month, grade: r.grade! }))
            .sort((a,b) => b.month - a.month)
    , [allResultsForYear]);

    // 전체 등급 분포에서 내 등급 위치
    const myCurrentMonthResult = allResultsForMonth.find(r => r.uniqueId === currentMonthResult?.uniqueId);

    return (
        <div className="space-y-4">
            {/* 연간 성과 히스토리 */}
            <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} asChild>
                <Card className="shadow-sm border-gray-200 overflow-hidden">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer p-4">
                            <div>
                                <CardTitle>연간 성과 히스토리</CardTitle>
                                <CardDescription>지난 1년간의 월별 성과 추이입니다.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon">
                                {isHistoryOpen ? <ChevronUp /> : <ChevronDown />}
                            </Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="p-6">
                            {/* 현재 선택된 월의 등급 강조 영역 (framer-motion으로 애니메이션 적용) */}
                            <AnimatePresence>
                                {currentMonthResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="relative mb-6 p-4 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 overflow-hidden"
                                    >
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 mb-2">{currentMonthResult.month}월 평가 결과</p>
                                            {/* 등급별로 정의된 색상을 적용 */}
                                            <div className={cn("text-6xl font-bold mb-2", gradeToColor[currentMonthResult.grade!] || 'text-gray-600')}>
                                                {currentMonthResult.grade}
                                            </div>
                                            {/* 조건에 따라 동기 부여 메시지 표시 */}
                                            {isTopTier && (
                                                <p className="text-lg text-orange-600 font-semibold">
                                                    훌륭해요! 최고의 성과입니다!
                                                </p>
                                            )}
                                            {isLowTier && (
                                                <p className="text-lg text-gray-600 font-semibold">
                                                    다음 달엔 더 잘할 수 있어요!
                                                </p>
                                            )}
                                            {!isTopTier && !isLowTier && currentMonthResult.grade && (
                                                <p className="text-lg text-gray-600 font-semibold">
                                                    꾸준한 성과를 보여주고 있어요!
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {/* Recharts 라인 차트 구현 */}
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="month" 
                                            fontSize={12}
                                            interval={0}
                                        />
                                        <YAxis 
                                            domain={[0, 150]}
                                            fontSize={12}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        {/* 커스텀 툴팁: 마우스 호버 시 상세 정보 표시 */}
                                        <Tooltip content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="rounded-lg border bg-background p-3 shadow-lg">
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
                                        }} />
                                        {/* `connectNulls`로 데이터가 없는 달은 선을 끊어서 표시 */}
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#f97316"
                                            strokeWidth={3}
                                            dot={{ fill: '#f97316', strokeWidth: 2, r: 6 }}
                                            activeDot={{ r: 8, stroke: '#f97316', strokeWidth: 2 }}
                                            connectNulls={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* 연간 누적 성과급 */}
            <Collapsible open={isPiggyBankOpen} onOpenChange={setIsPiggyBankOpen} asChild>
                <Card className="shadow-sm border-gray-200">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer p-4">
                            <div>
                                <CardTitle>연간 누적 성과급</CardTitle>
                                <CardDescription>올해 지급된 누적 성과급 총액입니다.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon">
                                {isPiggyBankOpen ? <ChevronUp /> : <ChevronDown />}
                            </Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center gap-8">
                                <div className="relative w-32 h-32">
                                    <PiggyBank className="w-full h-full text-orange-500" strokeWidth={1.5} />
                                <AnimatePresence>
                                        {Array.from({ length: Math.min(Math.floor(annualCumulativeBonus / 200000), 20) }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                                initial={{ opacity: 0, y: -20, x: Math.random() * 60 - 30 }}
                                            animate={{ 
                                                opacity: 1, 
                                                y: 10 + Math.random() * 20,
                                                transition: { delay: i * 0.05, duration: 0.5, ease: 'easeOut' }
                                            }}
                                            className="absolute top-1/2 left-1/2"
                                        >
                                                <div className="w-6 h-6 text-green-500" style={{ transform: `rotate(${Math.random() * 30 - 15}deg)`}}>
                                                    💰
                                                </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">누적 성과급</p>
                                    <p className="text-4xl font-bold text-orange-600">
                                    {annualCumulativeBonus.toLocaleString()}원
                                </p>
                                </div>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* 명예의 전당 */}
            <Collapsible open={isHallOfFameOpen} onOpenChange={setIsHallOfFameOpen} asChild>
                <Card className="shadow-sm border-gray-200">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer p-4">
                            <div>
                                <CardTitle>나의 명예의 전당</CardTitle>
                                <CardDescription>획득한 뱃지와 트로피를 확인하세요.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon">
                                {isHallOfFameOpen ? <ChevronUp /> : <ChevronDown />}
                            </Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* 디지털 뱃지 */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">디지털 뱃지</h3>
                            {acquiredBadges.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {acquiredBadges.map((badge, index) => {
                                        const info = badgeInfo[badge.grade];
                                        const Icon = info?.icon || Award;
                                        return (
                                            <motion.div
                                                key={`${badge.month}-${badge.grade}`}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.1 }}
                                                        className="flex flex-col items-center p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100"
                                            >
                                                <Icon className={cn("w-8 h-8 mb-2", info?.color)} />
                                                        <p className="text-sm font-semibold">{info?.label} 뱃지 획득!</p>
                                                        <p className="text-xs text-gray-600">{badge.month}월 평가: {badge.grade} 등급</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">아직 획득한 뱃지가 없습니다.</p>
                                        </div>
                                    )}
                                </div>

                                {/* 연간 트로피 */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">연간 트로피</h3>
                                    <div className="text-center py-8">
                                        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">아직 획득한 트로피가 없습니다.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </div>
    );
}
