'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceChartProps {
  allResultsForYear: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}

const gradeToColor: Record<string, string> = {
    'S': 'text-purple-500', 'A+': 'text-blue-500', 'A': 'text-sky-500',
    'B+': 'text-muted-foreground', 'B': 'text-muted-foreground', 'B-': 'text-muted-foreground',
    'C': 'text-orange-500', 'C-': 'text-orange-500', 'D': 'text-red-500'
};

export default function PerformanceChart({ allResultsForYear, gradingScale }: PerformanceChartProps) {
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(true);

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

    const latestResult = React.useMemo(() => 
        allResultsForYear.length > 0 ? allResultsForYear.sort((a,b) => b.month - a.month)[0] : null
    , [allResultsForYear]);

    const isTopTier = React.useMemo(() => 
        latestResult?.grade && ['S', 'A+', 'A'].includes(latestResult.grade)
    , [latestResult]);

    const isLowTier = React.useMemo(() => 
        latestResult?.grade && ['C', 'C-', 'D'].includes(latestResult.grade)
    , [latestResult]);

    return (
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
                    <CardContent className="p-4">
                        <AnimatePresence>
                            {latestResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="relative mb-4 p-4 rounded-lg bg-gray-50 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                최근 성과: {latestResult.month}월
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                등급: <span className={gradeToColor[latestResult.grade || ''] || 'text-gray-500'}>
                                                    {latestResult.grade || '미평가'}
                                                </span>
                                                {latestResult.score && ` (${latestResult.score}점)`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-orange-600">
                                                {latestResult.finalAmount.toLocaleString()}원
                                            </p>
                                            <p className="text-sm text-gray-500">최종 지급액</p>
                                        </div>
                                    </div>
                                    {(isTopTier || isLowTier) && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute top-2 right-2"
                                        >
                                            <div className={`text-2xl ${isTopTier ? 'text-yellow-500' : 'text-red-500'}`}>
                                                {isTopTier ? '🏆' : '⚠️'}
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="month" 
                                        tick={{ fontSize: 12 }}
                                        interval={0}
                                    />
                                    <YAxis 
                                        domain={[0, 100]}
                                        tick={{ fontSize: 12 }}
                                        label={{ value: '점수', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip 
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
                                                        <p className="font-medium">{label}</p>
                                                        {data.score && (
                                                            <p className="text-sm">
                                                                점수: <span className="font-semibold">{data.score}점</span>
                                                            </p>
                                                        )}
                                                        {data.grade && (
                                                            <p className="text-sm">
                                                                등급: <span className={`font-semibold ${gradeToColor[data.grade]}`}>
                                                                    {data.grade}
                                                                </span>
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                                        connectNulls={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
} 