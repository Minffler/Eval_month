'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, BarChart3, Eye } from 'lucide-react';
import { validateGradeConsistency, type ValidateGradeConsistencyOutput } from '@/ai/flows/grade-consistency-validation';
import { testGoogleAI } from '@/ai/simple-test';
import { 
  saveConsistencyAnalysis, 
  loadConsistencyAnalysis, 
  hasConsistencyAnalysis,
  type ConsistencyAnalysisRecord 
} from '@/lib/consistency-storage';
import { Badge } from '../ui/badge';
import type { EvaluationResult, Grade, GradeInfo, User } from '@/lib/types';
import { mockUsers } from '@/lib/data';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, LabelList } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface ConsistencyValidatorProps {
  results: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate?: { year: number; month: number };
}

const chartConfig = {
  value: {
    label: '인원수',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const CustomXAxisTick = (props: any) => {
    const { x, y, payload, gradingScale } = props;
    const grade = payload.value as Grade;

    if (!grade || !gradingScale[grade]) {
        return null;
    }
    
    const score = gradingScale[grade].score;

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={12} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={12} fontWeight="500">
                {grade}
            </text>
            <text x={0} y={0} dy={26} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={11}>
                ({score}점)
            </text>
        </g>
    );
};

export function ConsistencyValidator({ results, gradingScale, selectedDate }: ConsistencyValidatorProps) {
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<ValidateGradeConsistencyOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [hasSavedAnalysis, setHasSavedAnalysis] = React.useState(false);
  const [highlightedEvaluator, setHighlightedEvaluator] = React.useState<string | null>(null);
  const [selectedEvaluatorForComparison, setSelectedEvaluatorForComparison] = React.useState<string>('');

  // 선택된 날짜가 변경될 때 저장된 분석 결과를 자동으로 로드
  React.useEffect(() => {
    if (selectedDate) {
      const savedAnalysis = loadConsistencyAnalysis(selectedDate.year, selectedDate.month);
      if (savedAnalysis) {
        console.log(`저장된 분석 결과 자동 로드: ${selectedDate.year}-${selectedDate.month}`);
        setReport(savedAnalysis.result);
        setHasSavedAnalysis(true);
      } else {
        setReport(null);
        setHasSavedAnalysis(false);
      }
    } else {
      setReport(null);
      setHasSavedAnalysis(false);
    }
  }, [selectedDate]);

  // 평가자 ID로 이름을 찾는 함수
  const getEvaluatorName = (evaluatorId: string): string => {
    console.log(`getEvaluatorName 호출: evaluatorId = ${evaluatorId}`);
    
    // admin의 경우 특별 처리
    if (evaluatorId === 'admin') {
      console.log('admin 사용자 발견');
      return '관리자';
    }
    
    const user = mockUsers.find((u: User) => u.uniqueId === evaluatorId);
    console.log(`사용자 검색 결과:`, user ? `찾음 - ${user.name}` : `찾지 못함 - ${evaluatorId}`);
    
    return user ? user.name : evaluatorId;
  };

  async function handleAnalyze() {
    setLoading(true);
    setReport(null);
    setError(null);
    
    // 오류 상태에서 재시도하는 경우 오류를 초기화
    if (error) {
      setError(null);
    }

    try {
      // 선택된 날짜 확인
      if (!selectedDate) {
        throw new Error("분석할 월을 선택해주세요.");
      }

      const { year, month } = selectedDate;

      // 먼저 Google AI API 직접 테스트
      console.log("Google AI API 직접 테스트 시작...");
      const apiTest = await testGoogleAI();
      console.log("Google AI API 테스트 결과:", apiTest);
      
      if (!apiTest.success) {
        throw new Error(`Google AI API 연결 실패: ${apiTest.error}`);
      }
      
      // 데이터가 충분한지 확인
      if (results.length === 0) {
        throw new Error("분석할 평가 데이터가 없습니다.");
      }

      console.log("분석할 평가 데이터:", results);
      console.log("평가자 ID 목록:", [...new Set(results.map(r => r.evaluatorId))]);

      const gradeDataByEvaluator = results.reduce((acc, result) => {
        const evaluatorId = result.evaluatorId || '';
        
        console.log(`평가자 ID: ${evaluatorId}`);
        
        // evaluatorId만 사용하여 키 생성
        if (!acc[evaluatorId]) {
          acc[evaluatorId] = [];
        }
        if (result.grade) {
          acc[evaluatorId].push(result.grade);
        }
        return acc;
      }, {} as Record<string, string[]>);
      
      console.log("평가자별 등급 데이터:", gradeDataByEvaluator);

      // 평가자가 충분한지 확인
      const evaluators = Object.keys(gradeDataByEvaluator);
      if (evaluators.length < 2) {
        throw new Error(`현재 ${evaluators.length}명의 평가자 데이터만 있습니다. 분석을 위해서는 최소 2명 이상의 평가자 데이터가 필요합니다.`);
      }

      const gradeDataString = Object.entries(gradeDataByEvaluator)
        .map(([evaluatorId, grades]) => {
          const evaluatorName = getEvaluatorName(evaluatorId);
          return `${evaluatorName} (${evaluatorId}): ${grades.join(', ')}`;
        })
        .join('\n');

      const expectedDistribution =
        '대부분의 직원은 B 또는 B+ 등급을 받아야 하며, S 또는 D 등급을 받는 직원은 소수여야 합니다. 등급 분포는 평가자 간에 비교적 균등해야 하며, 특정 평가자가 유독 후하거나 박한 점수를 주는 경향이 없어야 합니다.';
      
      console.log("AI 분석에 전송할 데이터:");
      console.log("gradeDataString:", gradeDataString);
      console.log("expectedDistribution:", expectedDistribution);
      
      // AI 분석 실행 (300초 타임아웃 설정)
      const analysisPromise = validateGradeConsistency({
        gradeData: gradeDataString,
        expectedDistribution,
      });
      
      // 300초 타임아웃으로 AI 분석 실행
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('AI 분석 시간이 초과되었습니다. 다시 시도해주세요.')), 300000)
      );
      
      const analysisResult = await Promise.race([analysisPromise, timeoutPromise]);
      
      // 분석 결과 저장
      saveConsistencyAnalysis(year, month, analysisResult, gradeDataString, expectedDistribution);
      
      setReport(analysisResult);
    } catch (error) {
      console.error('Error validating consistency:', error);
      
      let errorMessage = '분석 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        if (error.message.includes('네트워크')) {
          errorMessage = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
        } else if (error.message.includes('API 키')) {
          errorMessage = 'AI 서비스 API 키가 유효하지 않습니다. 관리자에게 문의해주세요.';
        } else if (error.message.includes('사용량 한도')) {
          errorMessage = 'AI 서비스 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('대체 분석')) {
          errorMessage = 'AI 서비스에 연결할 수 없어 대체 분석을 사용합니다. 일부 기능이 제한될 수 있습니다.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const getBadgeVariant = (type: '편향' | '불일치' | '긍정적 발견'): 'destructive' | 'secondary' | 'default' => {
    switch (type) {
      case '편향':
      case '불일치':
        return 'destructive';
      case '긍정적 발견':
        return 'default';
      default:
        return 'secondary';
    }
  };

  // 평가자별 등급 분포 데이터 생성
  const evaluatorGradeData = React.useMemo(() => {
    if (!report) return {};
    
    const data: Record<string, Record<string, number>> = {};
    const gradeDataByEvaluator = results.reduce((acc, result) => {
      const evaluatorId = result.evaluatorId || '';
      const evaluatorName = getEvaluatorName(evaluatorId);
      
      // ID를 기준으로 키 생성 (동명이인 방지)
      const key = `${evaluatorName} (${evaluatorId})`;
      if (!acc[key]) {
        acc[key] = [];
      }
      if (result.grade) {
        acc[key].push(result.grade);
      }
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(gradeDataByEvaluator).forEach(([evaluator, grades]) => {
      const gradeCounts: Record<string, number> = {};
      grades.forEach(grade => {
        gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
      });
      data[evaluator] = gradeCounts;
    });

    return data;
  }, [report, results]);

  const chartData = React.useMemo(() => {
    if (!report) return [];
    const totalCount = report.overallDistribution.reduce((acc, curr) => acc + curr.count, 0);
    return [...report.overallDistribution]
    .filter(d => {
      const grade = d.grade as Grade;
      return grade && gradingScale[grade] !== undefined;
    })
    .sort((a,b) => {
        const gradeA = a.grade as Grade;
        const gradeB = b.grade as Grade;
        const scoreA = gradeA && gradingScale[gradeA] ? gradingScale[gradeA].score : -1;
        const scoreB = gradeB && gradingScale[gradeB] ? gradingScale[gradeB].score : -1;
        return scoreA - scoreB; // D(0점) → S(150점) 순서로 변경
    })
    .map(item => ({
        name: item.grade,
        value: item.count,
        percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
        highlightedValue: highlightedEvaluator && evaluatorGradeData[highlightedEvaluator] ? evaluatorGradeData[highlightedEvaluator][item.grade] || 0 : 0,
    }));
  }, [report, gradingScale, highlightedEvaluator, evaluatorGradeData]);

  // 프론트엔드 로직으로 전체 등급분포 계산
  const overallGradeDistribution = React.useMemo(() => {
    const gradeCounts: Record<string, number> = {};
    
    results.forEach(result => {
      if (result.grade) {
        gradeCounts[result.grade] = (gradeCounts[result.grade] || 0) + 1;
      }
    });

    const total = Object.values(gradeCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(gradeCounts)
      .map(([grade, count]) => ({
        grade,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => {
        const scoreA = gradingScale[a.grade as Grade]?.score || -1;
        const scoreB = gradingScale[b.grade as Grade]?.score || -1;
        return scoreA - scoreB;
      });
  }, [results, gradingScale]);

  // 평가자별 등급분포 계산 (evaluatorId 기반)
  const evaluatorGradeDistribution = React.useMemo(() => {
    const evaluatorData: Record<string, Record<string, number>> = {};
    
    results.forEach(result => {
      const evaluatorId = result.evaluatorId;
      
      if (!evaluatorData[evaluatorId]) {
        evaluatorData[evaluatorId] = {};
      }
      
      if (result.grade) {
        evaluatorData[evaluatorId][result.grade] = (evaluatorData[evaluatorId][result.grade] || 0) + 1;
      }
    });

    return evaluatorData;
  }, [results]);

  // 비교 차트용 데이터 생성
  const comparisonChartData = React.useMemo(() => {
    if (!selectedEvaluatorForComparison) {
      // 전체 분포만 표시
      const total = overallGradeDistribution.reduce((sum, item) => sum + item.count, 0);
      return overallGradeDistribution.map(item => ({
        grade: item.grade,
        overall: item.count,
        evaluator: 0,
        total: item.count,
        overallPercentage: total > 0 ? (item.count / total) * 100 : 0,
        overallLabel: `${item.count}명 (${total > 0 ? (item.count / total) * 100 : 0}%)`
      }));
    }

    // 선택된 평가자와 전체 분포 비교
    const evaluatorData = evaluatorGradeDistribution[selectedEvaluatorForComparison] || {};
    const total = overallGradeDistribution.reduce((sum, item) => sum + item.count, 0);
    const evaluatorTotal = Object.values(evaluatorData).reduce((sum, count) => sum + count, 0);
    
    return overallGradeDistribution.map(item => ({
      grade: item.grade,
      overall: item.count,
      evaluator: evaluatorData[item.grade] || 0,
      total: item.count,
      overallPercentage: total > 0 ? (item.count / total) * 100 : 0,
      evaluatorPercentage: evaluatorTotal > 0 ? ((evaluatorData[item.grade] || 0) / evaluatorTotal) * 100 : 0,
      overallLabel: `${item.count}명 (${(total > 0 ? (item.count / total) * 100 : 0).toFixed(1)}%)`,
      evaluatorLabel: evaluatorTotal > 0 ? `${evaluatorData[item.grade] || 0}명 (${((evaluatorData[item.grade] || 0) / evaluatorTotal * 100).toFixed(1)}%)` : ''
    }));
  }, [overallGradeDistribution, selectedEvaluatorForComparison, evaluatorGradeDistribution]);

  const handleHighlightEvaluator = (evaluatorKey: string) => {
    console.log('눈 모양 버튼 클릭:', evaluatorKey);
    console.log('현재 highlightedEvaluator:', highlightedEvaluator);
    console.log('사용 가능한 evaluatorGradeData 키:', Object.keys(evaluatorGradeData));
    setHighlightedEvaluator(highlightedEvaluator === evaluatorKey ? null : evaluatorKey);
  };

  const clearHighlight = () => {
    setHighlightedEvaluator(null);
  };

  const CombinedLabel = (props: any) => {
    const { x, y, width, height, index } = props;
    const item = chartData[index];

    if (!item || item.value <= 0) {
      return null;
    }

    const countText = item.value;
    const percentageText = `${item.percentage.toFixed(1)}%`;

    if (height < 30) {
      return (
        <g>
          <text x={x + width / 2} y={y - 20} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">
            {countText}
          </text>
          <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">
            {percentageText}
          </text>
        </g>
      );
    }

    return (
      <g>
        <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">
          {countText}
        </text>
        <text x={x + width / 2} y={y + 14} textAnchor="middle" fontSize={11} fill="hsl(var(--primary-foreground))">
          {percentageText}
        </text>
      </g>
    );
  };

  // 강조된 데이터용 라벨 컴포넌트
  const HighlightedLabel = (props: any) => {
    const { x, y, width, height, index } = props;
    const item = chartData[index];

    if (!item || item.highlightedValue <= 0) {
      return null;
    }

    const countText = item.highlightedValue;
    const totalHighlighted = chartData.reduce((sum, data) => sum + data.highlightedValue, 0);
    const percentageText = totalHighlighted > 0 ? `${((countText / totalHighlighted) * 100).toFixed(1)}%` : '0%';

    if (height < 30) {
      return (
        <g>
          <text x={x + width / 2} y={y - 20} textAnchor="middle" fontSize={12} fill="white">
            {countText}
          </text>
          <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={11} fill="white">
            {percentageText}
          </text>
        </g>
      );
    }

    return (
      <g>
        <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={12} fill="white">
          {countText}
        </text>
        <text x={x + width / 2} y={y + 14} textAnchor="middle" fontSize={11} fill="white">
          {percentageText}
        </text>
      </g>
    );
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">등급 일관성 분석</CardTitle>
          <CardDescription>
            AI를 사용하여 현재 데이터 기반으로 평가자별 등급 분포를 분석하고 잠재적 편향을 식별합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
              아래 버튼을 클릭하면 {selectedDate ? `${selectedDate.year}년 ${selectedDate.month}월` : '현재'} 평가 데이터를 사용하여 평가자 간 등급 부여의 일관성을 검토합니다. AI는 각 평가자의 등급 분포를 비교하여 유난히 관대하거나 엄격한 평가 경향이 있는지, 특정 그룹에 대한 편향이 있는지 등을 분석합니다.
            </p>
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">오류: {error}</p>
              </div>
            )}
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-4">
            <div className="space-y-2">
          <Button onClick={handleAnalyze} disabled={loading || results.length === 0 || error !== null} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
                {hasSavedAnalysis ? "새로 분석하기" : "AI로 평가자별 편향 검토하기"}
              </Button>
            </div>
            
            {/* 프론트엔드 등급분포 비교 차트 - AI 분석 결과와 함께 표시 */}
            {report && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">등급분포 비교</h4>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedEvaluatorForComparison}
                      onChange={(e) => setSelectedEvaluatorForComparison(e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-background"
                    >
                      <option value="">전체 분포만</option>
                      {Object.keys(evaluatorGradeDistribution).map(evaluatorKey => (
                        <option key={evaluatorKey} value={evaluatorKey}>
                          {evaluatorKey}
                        </option>
                      ))}
                    </select>
                    {selectedEvaluatorForComparison !== '' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvaluatorForComparison('')}
                        className="h-6 px-2 text-xs"
                      >
                        초기화
          </Button>
                    )}
                  </div>
                </div>
                
                <div className="h-[300px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparisonChartData}
                        margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                      >
                        <XAxis
                          dataKey="grade"
                          tickLine={false}
                          axisLine={false}
                          tick={<CustomXAxisTick gradingScale={gradingScale} />}
                          height={35}
                          interval={0}
                        />
                        <YAxis
                          type="number"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                          allowDecimals={false}
                        />
                        <ChartTooltip
                          cursor={{ fill: 'hsl(var(--muted))' }}
                          content={<ChartTooltipContent />}
                        />
                        {/* 전체 분포 (주황색) */}
                        <Bar
                          dataKey="overall"
                          fill="#f97316"
                          radius={[4, 4, 0, 0]}
                        />
                        {/* 선택된 평가자 분포 (파란색) */}
                        {selectedEvaluatorForComparison !== '' && (
                          <Bar
                            dataKey="evaluator"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                          />
                        )}
                        
                        {/* 차트 라벨 추가 */}
                        <LabelList
                          dataKey="overall"
                          position="top"
                          fontSize={12}
                          fill="#000000"
                          fontWeight="600"
                          content={(props) => {
                            const { value, x, y, width } = props;
                            if (!value || value === 0) return null;
                            return (
                              <text
                                x={Number(x) + Number(width) / 2}
                                y={Number(y) - 5}
                                textAnchor="middle"
                                fontSize={12}
                                fill="#000000"
                                fontWeight="600"
                              >
                                {value}
                              </text>
                            );
                          }}
                        />
                        
                        {/* 선택된 평가자 라벨 */}
                        {selectedEvaluatorForComparison !== '' && (
                          <LabelList
                            dataKey="evaluator"
                            position="top"
                            fontSize={12}
                            fill="#ffffff"
                            fontWeight="600"
                            content={(props) => {
                              const { value, x, y, width } = props;
                              if (!value || value === 0) return null;
                              return (
                                <text
                                  x={Number(x) + Number(width) / 2}
                                  y={Number(y) - 5}
                                  textAnchor="middle"
                                  fontSize={12}
                                  fill="#ffffff"
                                  fontWeight="600"
                                >
                                  {value}
                                </text>
                              );
                            }}
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                
                {/* 범례와 통계 정보 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>전체 분포</span>
                    </div>
                    {selectedEvaluatorForComparison !== '' && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>{selectedEvaluatorForComparison}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 통계 정보 */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-medium text-muted-foreground">전체 통계</div>
                      <div className="space-y-0.5">
                        {overallGradeDistribution.map(item => (
                          <div key={item.grade} className="flex justify-between">
                            <span>{item.grade}:</span>
                            <span>{item.count}명 ({item.percentage.toFixed(1)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {selectedEvaluatorForComparison !== '' && (
                      <div className="space-y-1">
                        <div className="font-medium text-muted-foreground">{selectedEvaluatorForComparison}</div>
                        <div className="space-y-0.5">
                          {Object.entries(evaluatorGradeDistribution[selectedEvaluatorForComparison] || {}).map(([grade, count]) => {
                            const total = Object.values(evaluatorGradeDistribution[selectedEvaluatorForComparison] || {}).reduce((sum, c) => sum + c, 0);
                            const percentage = total > 0 ? (count / total) * 100 : 0;
                            return (
                              <div key={grade} className="flex justify-between">
                                <span>{grade}:</span>
                                <span>{count}명 ({percentage.toFixed(1)}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">AI 일관성 리포트</CardTitle>
          <CardDescription>
            생성된 리포트가 아래에 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-none space-y-4 rounded-md border p-4 min-h-[400px]">
          {loading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="text-destructive text-lg font-semibold">분석 불가</div>
                <p className="text-sm text-muted-foreground max-w-md">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  더 많은 평가자 데이터를 추가한 후 다시 시도해주세요.
                </p>
              </div>
            </div>
          )}
          {report ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">요약</h3>
                <p className="text-sm text-muted-foreground">{report.summary}</p>
              </div>
              
              <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">전체 등급 분포</h3>
                  </div>
                <div className="h-[250px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                      >
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={<CustomXAxisTick gradingScale={gradingScale} />}
                          height={40}
                          interval={0}
                        />
                        <YAxis
                          type="number"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                          allowDecimals={false}
                        />
                        <ChartTooltip
                          cursor={{ fill: 'hsl(var(--muted))' }}
                          content={<ChartTooltipContent />}
                        />
                        {/* 전체 분포 (회색) */}
                        <Bar
                          dataKey="value"
                          fill={highlightedEvaluator ? "#a4a3a2" : "var(--color-value)"}
                          radius={[4, 4, 0, 0]}
                          opacity={highlightedEvaluator ? 0.7 : 1}
                        >
                          <LabelList dataKey="value" content={<CombinedLabel />} />
                        </Bar>
                        {/* 강조된 평가자 분포 (강조색) */}
                        {highlightedEvaluator && (
                          <Bar
                            dataKey="highlightedValue"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                            opacity={1}
                          >
                            <LabelList dataKey="highlightedValue" content={<HighlightedLabel />} />
                          </Bar>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                {highlightedEvaluator && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">{highlightedEvaluator}</span> 평가자의 등급 분포가 강조 표시됩니다.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">주요 발견 사항</h3>
                <div className="space-y-3">
                  {report.findings.length > 0 ? (
                    report.findings.map((finding, index) => {
                      // AI 응답에서 평가자 키 추출 ("평가자이름 (평가자ID)" 형태)
                      let evaluatorKey: string | null = null;
                      
                      // "평가자이름 (평가자ID)" 형태 추출 (한글+영문 혼합 가능)
                      const evaluatorMatch = finding.description.match(/([가-힣a-zA-Z]+)\s*\(([^)]+)\)/);
                      if (evaluatorMatch) {
                        const evaluatorName = evaluatorMatch[1]; // "관리자"
                        const evaluatorId = evaluatorMatch[2];   // "admin"
                        const fullEvaluatorKey = `${evaluatorName} (${evaluatorId})`; // "관리자 (admin)"
                        
                        // evaluatorGradeData에 해당 키가 존재하는지 확인
                        if (evaluatorGradeData[fullEvaluatorKey]) {
                          evaluatorKey = fullEvaluatorKey;
                        }
                      }
                      
                      // 디버깅: 매칭 결과 확인
                      console.log('AI 리포트 - 평가자 매칭:', {
                        evaluatorMatch: evaluatorMatch ? `${evaluatorMatch[1]} (${evaluatorMatch[2]})` : null,
                        evaluatorKey,
                        availableKeys: Object.keys(evaluatorGradeData)
                      });
                      
                      // 원래 AI 문장을 그대로 유지
                      let displayText = finding.description;
                      
                      return (
                      <div key={index} className="p-3 border rounded-md bg-muted/50">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                          <Badge variant={getBadgeVariant(finding.type)} className="whitespace-nowrap">{finding.type}</Badge>
                              <p className="font-semibold text-sm">{displayText}</p>
                            </div>
                            {finding.type === '편향' && evaluatorKey && evaluatorGradeData[evaluatorKey] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleHighlightEvaluator(evaluatorKey)}
                                className={`h-6 w-6 p-0 ${
                                  highlightedEvaluator === evaluatorKey 
                                    ? 'text-primary bg-primary/10' 
                                    : 'text-muted-foreground hover:text-white hover:bg-primary'
                                }`}
                                title={`${getEvaluatorName(evaluatorKey)} (${evaluatorKey}) 평가자의 등급 분포를 차트에서 강조 표시`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground pl-2 border-l-2 ml-1.5">{finding.evidence}</p>
                      </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">특별한 발견 사항이 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          ) : !loading && !error && <p className="text-muted-foreground text-center pt-16">리포트가 여기에 생성됩니다...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
