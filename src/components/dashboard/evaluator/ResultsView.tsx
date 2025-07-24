import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, User, Star, Calendar } from 'lucide-react';

interface Evaluation {
  id: string;
  employeeName: string;
  department: string;
  score: number;
  comment: string;
  strengths: string;
  improvements: string;
  date: string;
  status: 'completed' | 'pending';
}

interface ResultsViewProps {
  evaluations: Evaluation[];
  selectedMonth: string;
}

/**
 * 평가 결과 조회 컴포넌트
 * 완료된 평가들의 결과를 표시
 */
export const ResultsView: React.FC<ResultsViewProps> = ({
  evaluations,
  selectedMonth
}) => {
  // 통계 계산
  const stats = useMemo(() => {
    if (evaluations.length === 0) {
      return {
        averageScore: 0,
        totalEvaluations: 0,
        scoreDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const totalScore = evaluations.reduce((sum, eval) => sum + eval.score, 0);
    const averageScore = totalScore / evaluations.length;
    
    const scoreDistribution = evaluations.reduce((acc, eval) => {
      acc[eval.score as keyof typeof acc] = (acc[eval.score as keyof typeof acc] || 0) + 1;
      return acc;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

    return {
      averageScore,
      totalEvaluations: evaluations.length,
      scoreDistribution
    };
  }, [evaluations]);

  const getScoreBadge = (score: number) => {
    const scoreConfig = {
      5: { label: '5점', variant: 'default' as const, color: 'text-green-600' },
      4: { label: '4점', variant: 'default' as const, color: 'text-blue-600' },
      3: { label: '3점', variant: 'secondary' as const, color: 'text-yellow-600' },
      2: { label: '2점', variant: 'secondary' as const, color: 'text-orange-600' },
      1: { label: '1점', variant: 'destructive' as const, color: 'text-red-600' }
    };
    
    const config = scoreConfig[score as keyof typeof scoreConfig];
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          평가 결과
          <Badge variant="outline" className="ml-auto">
            {evaluations.length}개 완료
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {evaluations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BarChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>완료된 평가가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 통계 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">평균 점수</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {stats.averageScore.toFixed(1)}점
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">총 평가 수</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {stats.totalEvaluations}명
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">평가 월</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {selectedMonth}
                </div>
              </div>
            </div>

            {/* 점수 분포 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">점수 분포</h4>
              <div className="grid grid-cols-5 gap-2">
                {[5, 4, 3, 2, 1].map((score) => (
                  <div key={score} className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-bold">{score}점</div>
                    <div className="text-sm text-gray-600">
                      {stats.scoreDistribution[score as keyof typeof stats.scoreDistribution]}명
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 평가 결과 테이블 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">상세 결과</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>직원</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>점수</TableHead>
                    <TableHead>평가일</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {evaluation.employeeName}
                        </div>
                      </TableCell>
                      <TableCell>{evaluation.department}</TableCell>
                      <TableCell>{getScoreBadge(evaluation.score)}</TableCell>
                      <TableCell>{formatDate(evaluation.date)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 