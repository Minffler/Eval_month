'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, Medal, Trophy, PiggyBank, Sparkles } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartTooltipContent } from '../ui/chart';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MyPerformanceReviewProps {
  allResultsForYear: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

const gradeToColor: Record<string, string> = {
    'S': 'text-purple-500', 'A+': 'text-blue-500', 'A': 'text-sky-500',
    'B+': 'text-green-500', 'B': 'text-lime-500', 'B-': 'text-yellow-500',
    'C': 'text-orange-500', 'C-': 'text-red-500', 'D': 'text-gray-500'
};

const badgeInfo: Record<string, {label: string, icon: string, color: string}> = {
    'S': { label: 'Platinum', icon: '/badges/platinum.svg', color: 'from-gray-400 to-gray-200' },
    'A+': { label: 'Gold', icon: '/badges/gold.svg', color: 'from-yellow-400 to-yellow-200' },
    'A': { label: 'Silver', icon: '/badges/silver.svg', color: 'from-slate-400 to-slate-200' },
    'B+': { label: 'Bronze', icon: '/badges/bronze.svg', color: 'from-orange-400 to-orange-200' },
};


export default function MyPerformanceReview({ allResultsForYear, gradingScale }: MyPerformanceReviewProps) {
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(true);
    const [isPiggyBankOpen, setIsPiggyBankOpen] = React.useState(true);
    const [isHallOfFameOpen, setIsHallOfFameOpen] = React.useState(true);

    const chartData = React.useMemo(() => 
        Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const result = allResultsForYear.find(r => r.month === month);
            return {
                month: `${month}월`,
                score: result?.score ?? null,
                grade: result?.grade ?? null
            };
        })
    , [allResultsForYear]);

    const annualCumulativeBonus = React.useMemo(() =>
        allResultsForYear.reduce((acc, curr) => acc + curr.finalAmount, 0)
    , [allResultsForYear]);
    
    const billsCount = Math.min(Math.floor(annualCumulativeBonus / 50000), 20);

    const acquiredBadges = React.useMemo(() => 
        allResultsForYear
            .filter(r => r.grade && ['S', 'A+', 'A', 'B+'].includes(r.grade))
            .map(r => ({ month: r.month, grade: r.grade! }))
            .sort((a,b) => b.month - a.month)
    , [allResultsForYear]);

    // This is a placeholder for a real ranking calculation
    const trophy = null; // { rank: 1, type: 'Gold' }

    return (
        <div className="space-y-6">
            <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} asChild>
                <Card>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                            <div><CardTitle>연간 성과 히스토리</CardTitle><CardDescription>지난 1년간의 월별 성과 추이입니다.</CardDescription></div>
                            <Button variant="ghost" size="icon">{isHistoryOpen ? <ChevronUp /> : <ChevronDown />}</Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="h-64">
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
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            <Collapsible open={isPiggyBankOpen} onOpenChange={setIsPiggyBankOpen} asChild>
                <Card>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                            <div><CardTitle>연간 누적 성과급</CardTitle><CardDescription>올해 지급된 누적 성과급 총액입니다.</CardDescription></div>
                             <Button variant="ghost" size="icon">{isPiggyBankOpen ? <ChevronUp /> : <ChevronDown />}</Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8">
                            <div className="relative w-48 h-48">
                                <Image src="/piggy-bank.svg" alt="Piggy Bank" width={192} height={192} className="absolute inset-0 z-10"/>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative w-2/3 h-2/3">
                                        {Array.from({ length: billsCount }).map((_, i) => (
                                            <Image key={i} src="/money-bill.svg" alt="Money Bill" width={60} height={30}
                                                className="absolute"
                                                style={{
                                                    bottom: `${i * 3}%`,
                                                    left: `${(i % 2) * 20}%`,
                                                    transform: `rotate(${i * 5}deg)`,
                                                    opacity: 0.8
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-sm text-muted-foreground">누적 성과급</p>
                                <p className="text-4xl font-bold text-primary">
                                    {new Intl.NumberFormat('ko-KR').format(annualCumulativeBonus)}원
                                </p>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            <Collapsible open={isHallOfFameOpen} onOpenChange={setIsHallOfFameOpen} asChild>
                <Card>
                    <CollapsibleTrigger asChild>
                         <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                            <div><CardTitle>나의 명예의 전당</CardTitle><CardDescription>획득한 뱃지와 트로피를 확인하세요.</CardDescription></div>
                             <Button variant="ghost" size="icon">{isHallOfFameOpen ? <ChevronUp /> : <ChevronDown />}</Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2"><Medal className="text-yellow-500" /> 디지털 뱃지</h3>
                                <div className="p-4 border rounded-lg h-48 overflow-y-auto">
                                    {acquiredBadges.length > 0 ? (
                                        <ul className="space-y-3">
                                            {acquiredBadges.map(({ month, grade }) => (
                                                <li key={month} className="flex items-center gap-4">
                                                    <div className={cn("w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br", badgeInfo[grade].color)}>
                                                        <Image src={badgeInfo[grade].icon} alt={`${badgeInfo[grade].label} Badge`} width={36} height={36} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{badgeInfo[grade].label} 뱃지 획득!</p>
                                                        <p className="text-sm text-muted-foreground">{month}월 평가: {grade} 등급</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-center text-muted-foreground pt-12">아직 획득한 뱃지가 없습니다.</p>}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2"><Trophy className="text-yellow-500" /> 연간 트로피</h3>
                                <div className="p-4 border rounded-lg h-48 flex items-center justify-center">
                                    {trophy ? (
                                        <div className="text-center">
                                            {/* Trophy display logic here */}
                                        </div>
                                    ) : <p className="text-center text-muted-foreground">아직 획득한 트로피가 없습니다.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </div>
    );
}
