'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Medal, Trophy, PiggyBank, Sparkles, Award, Banknote } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import PerformanceChart from './performance/performance-chart';

interface MyPerformanceReviewProps {
  allResultsForYear: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

const badgeInfo: Record<string, {label: string, icon: React.ElementType, color: string}> = {
    'S': { label: 'Platinum', icon: Award, color: 'text-slate-500' },
    'A+': { label: 'Gold', icon: Award, color: 'text-yellow-500' },
    'A': { label: 'Silver', icon: Award, color: 'text-slate-400' },
    'B+': { label: 'Bronze', icon: Award, color: 'text-orange-600' },
};

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
    const [isPiggyBankOpen, setIsPiggyBankOpen] = React.useState(true);
    const [isHallOfFameOpen, setIsHallOfFameOpen] = React.useState(true);

    const annualCumulativeBonus = React.useMemo(() =>
        allResultsForYear.reduce((acc, curr) => acc + curr.finalAmount, 0)
    , [allResultsForYear]);
    
    const billsCount = React.useMemo(() => 
        Math.min(Math.floor(annualCumulativeBonus / 200000), 50)
    , [annualCumulativeBonus]);

    const acquiredBadges = React.useMemo(() => 
        allResultsForYear
            .filter(r => r.grade && ['S', 'A+', 'A', 'B+'].includes(r.grade))
            .map(r => ({ month: r.month, grade: r.grade! }))
            .sort((a,b) => b.month - a.month)
    , [allResultsForYear]);

    return (
        <div className="space-y-4">
            <PerformanceChart allResultsForYear={allResultsForYear} gradingScale={gradingScale} />

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
                        <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8 p-6">
                            <div className="relative w-48 h-48">
                                <PiggyBank className="w-full h-full text-primary opacity-80" strokeWidth={1.5} />
                                <AnimatePresence>
                                    {Array.from({ length: billsCount }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: -20, x: Math.random() * 80 - 40 }}
                                            animate={{ 
                                                opacity: 1, 
                                                y: 10 + Math.random() * 20,
                                                transition: { delay: i * 0.05, duration: 0.5, ease: 'easeOut' }
                                            }}
                                            className="absolute top-1/2 left-1/2"
                                        >
                                            <Banknote className="w-8 h-8 text-green-500" style={{ transform: `rotate(${Math.random() * 30 - 15}deg)`}}/>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-4xl font-bold text-primary">
                                    {annualCumulativeBonus.toLocaleString()}원
                                </p>
                                <p className="text-lg text-muted-foreground mt-2">
                                    연간 누적 성과급
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    월 평균 {Math.round(annualCumulativeBonus / Math.max(allResultsForYear.length, 1)).toLocaleString()}원
                                </p>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            <Collapsible open={isHallOfFameOpen} onOpenChange={setIsHallOfFameOpen} asChild>
                <Card className="shadow-sm border-gray-200">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer p-4">
                            <div>
                                <CardTitle>수상 내역</CardTitle>
                                <CardDescription>올해 획득한 성과 배지들입니다.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon">
                                {isHallOfFameOpen ? <ChevronUp /> : <ChevronDown />}
                            </Button>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="p-4">
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
                                                className="flex flex-col items-center p-4 rounded-lg border bg-muted/50"
                                            >
                                                <Icon className={cn("w-8 h-8 mb-2", info?.color)} />
                                                <p className="text-sm font-semibold">{info?.label}</p>
                                                <p className="text-xs text-muted-foreground">{badge.month}월</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">아직 획득한 배지가 없습니다.</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        좋은 성과를 내면 배지를 획득할 수 있어요!
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </div>
    );
}
