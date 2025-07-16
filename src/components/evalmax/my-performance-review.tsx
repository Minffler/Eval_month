'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, Medal, Trophy, PiggyBank, Sparkles, Award } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartTooltipContent } from '../ui/chart';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MyPerformanceReviewProps {
  allResultsForYear: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

const gradeToColor: Record<string, string> = {
    'S': 'text-purple-500', 'A+': 'text-blue-500', 'A': 'text-sky-500',
    'B+': 'text-green-500', 'B': 'text-lime-500', 'B-': 'text-yellow-500',
    'C': 'text-orange-500', 'C-': 'text-red-500', 'D': 'text-gray-500'
};

const badgeInfo: Record<string, {label: string, icon: React.ElementType, color: string}> = {
    'S': { label: 'Platinum', icon: Award, color: 'text-slate-500' },
    'A+': { label: 'Gold', icon: Award, color: 'text-yellow-500' },
    'A': { label: 'Silver', icon: Award, color: 'text-slate-400' },
    'B+': { label: 'Bronze', icon: Award, color: 'text-orange-600' },
};

const TransparentPiggyBank = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M50.5 20C38.6258 20 29 29.5833 29 41.5V43.5C29 44.5 28.5 45 27.5 45H20C17.2386 45 15 47.2386 15 50V68C15 70.7614 17.2386 73 20 73H22.5M50.5 20C62.3742 20 72 29.5833 72 41.5V43.5C72 44.5 72.5 45 73.5 45H81C83.7614 45 86 47.2386 86 50V68C86 70.7614 83.7614 73 81 73H78.5M50.5 20C52.5 20 54 18.5 54 17C54 15.5 52.5 14 50.5 14C48.5 14 47 15.5 47 17C47 18.5 48.5 20 50.5 20ZM78.5 73V81.5C78.5 83.1569 77.1569 84.5 75.5 84.5H72.5M22.5 73V81.5C22.5 83.1569 23.8431 84.5 25.5 84.5H28.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M54.5 32H46.5C45.3954 32 44.5 32.8954 44.5 34V37C44.5 38.1046 45.3954 39 46.5 39H54.5C55.6046 39 56.5 38.1046 56.5 37V34C56.5 32.8954 55.6046 32 54.5 32Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ConfettiPiece = (props: React.ComponentProps<typeof motion.div>) => (
    <motion.div
        className="absolute w-2 h-4 rounded-full"
        initial={{ y: 0, opacity: 1 }}
        animate={{
            y: 150,
            rotate: Math.random() * 360,
            opacity: [1, 1, 0],
        }}
        transition={{ duration: 1.5 + Math.random(), ease: 'linear' }}
        {...props}
    />
);

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
    
    const billsCount = Math.min(Math.floor(annualCumulativeBonus / 50000), 100);

    const acquiredBadges = React.useMemo(() => 
        allResultsForYear
            .filter(r => r.grade && ['S', 'A+', 'A', 'B+'].includes(r.grade))
            .map(r => ({ month: r.month, grade: r.grade! }))
            .sort((a,b) => b.month - a.month)
    , [allResultsForYear]);

    const latestResult = allResultsForYear.length > 0 ? allResultsForYear.sort((a,b) => b.month - a.month)[0] : null;
    const isTopTier = latestResult?.grade && ['S', 'A+', 'A'].includes(latestResult.grade);
    const isLowTier = latestResult?.grade && ['C', 'C-', 'D'].includes(latestResult.grade);


    const trophy = null;

    return (
        <div className="space-y-6">
            <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} asChild>
                <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                            <div><CardTitle>연간 성과 히스토리</CardTitle><CardDescription>지난 1년간의 월별 성과 추이입니다.</CardDescription></div>
                            <Button variant="ghost" size="icon">{isHistoryOpen ? <ChevronUp /> : <ChevronDown />}</Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent>
                             <AnimatePresence>
                                {latestResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="relative mb-4 p-4 rounded-lg bg-muted/50 overflow-hidden"
                                    >
                                        {isTopTier && Array.from({ length: 30 }).map((_, i) => (
                                            <ConfettiPiece
                                                key={i}
                                                style={{
                                                    left: `${Math.random() * 100}%`,
                                                    top: `${Math.random() * -50}%`,
                                                    backgroundColor: ['#fde68a', '#fca5a5', '#818cf8', '#67e8f9'][i % 4],
                                                }}
                                            />
                                        ))}
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">{latestResult.month}월 평가 결과</p>
                                            <p className={cn("text-5xl font-bold", gradeToColor[latestResult.grade!] || 'text-foreground')}>
                                                {latestResult.grade}
                                            </p>
                                            {isTopTier && <p className="mt-1 font-semibold text-primary">훌륭해요! 최고의 성과입니다!</p>}
                                            {isLowTier && <p className="mt-1 font-semibold text-muted-foreground">다음 달엔 더 잘할 수 있어요!</p>}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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

            <Collapsible open={isPiggyBankOpen} onOpenChange={setIsPiggyBankOpen} asChild>
                <Card>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                            <div><CardTitle>연간 누적 성과급</CardTitle><CardDescription>올해 지급된 누적 성과급 총액입니다.</CardDescription></div>
                             <Button variant="ghost" size="icon">{isPiggyBankOpen ? <ChevronUp /> : <ChevronDown />}</Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8 p-6">
                             <div className="relative w-48 h-48 text-primary">
                                <TransparentPiggyBank className="w-full h-full opacity-30" strokeWidth={1.5} />
                                <div className="absolute inset-0 flex items-end justify-center">
                                    <div className="relative w-2/3 h-2/3">
                                        <AnimatePresence>
                                            {Array.from({ length: billsCount }).map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    layout
                                                    initial={{ opacity: 0, y: -100 }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                        transition: { delay: i * 0.02, duration: 0.5, ease: 'easeOut' },
                                                    }}
                                                    className="absolute bottom-0 w-10 h-5 bg-yellow-400 border border-yellow-500 rounded-sm"
                                                    style={{
                                                        left: `${Math.random() * 60 + 10}%`,
                                                        transform: `rotate(${Math.random() * 30 - 15}deg)`,
                                                        bottom: `${i * 1.5}%`,
                                                    }}
                                                />
                                            ))}
                                        </AnimatePresence>
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
                                            {acquiredBadges.map(({ month, grade }) => {
                                                const badge = badgeInfo[grade];
                                                if (!badge) return null;
                                                const BadgeIcon = badge.icon;
                                                return (
                                                <li key={month} className="flex items-center gap-4">
                                                    <div className={cn("w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center bg-muted")}>
                                                         <BadgeIcon className={cn("w-8 h-8", badge.color)} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{badge.label} 뱃지 획득!</p>
                                                        <p className="text-sm text-muted-foreground">{month}월 평가: {grade} 등급</p>
                                                    </div>
                                                </li>
                                            )})}
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
