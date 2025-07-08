'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  mockEvaluationGroups,
  gradingScale,
} from '@/lib/data';
import type { EvaluationResult, Grade } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GradeHistogram } from './grade-histogram';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';

interface EvaluatorDashboardProps {
  allResults: EvaluationResult[];
}

export default function EvaluatorDashboard({ allResults }: EvaluatorDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [evaluations, setEvaluations] = React.useState<Record<string, Grade>>(() => {
    const initialState: Record<string, Grade> = {};
    allResults.forEach(ev => {
        if(ev.grade) {
            initialState[ev.id] = ev.grade;
        }
    });
    return initialState;
  });

  const evaluatorGroups = React.useMemo(() => {
    if (!user) return [];
    return mockEvaluationGroups.filter(g => g.evaluatorId === user.id);
  }, [user]);

  const handleGradeChange = (employeeId: string, grade: Grade) => {
    setEvaluations(prev => ({ ...prev, [employeeId]: grade }));
  };

  const summary = React.useMemo(() => {
    return evaluatorGroups.map(group => {
      const currentScore = group.memberIds.reduce((acc, memberId) => {
        const grade = evaluations[memberId];
        return acc + (grade ? gradingScale[grade].score : 0);
      }, 0);
      return {
        ...group,
        memberCount: group.memberIds.length,
        completedCount: group.memberIds.filter(id => !!evaluations[id]).length,
        currentScore,
        remainingScore: group.totalScore - currentScore,
        isOverScore: currentScore > group.totalScore,
      };
    });
  }, [evaluatorGroups, evaluations]);

  const isSaveDisabled = summary.some(s => s.isOverScore);
  
  const handleSave = () => {
    if (isSaveDisabled) {
      toast({
        variant: 'destructive',
        title: '오류: 점수 초과',
        description: '하나 이상의 그룹이 총점 한도를 초과했습니다. 저장하기 전에 등급을 조정해주세요.',
      });
      return;
    }
    console.log('Saving evaluations:', evaluations);
    toast({
      title: '성공!',
      description: '평가가 성공적으로 저장되었습니다.',
      action: <Check className="text-green-500" />,
    });
  };

  const getGroupMembers = (groupId: string): EvaluationResult[] => {
    const group = evaluatorGroups.find(g => g.id === groupId);
    if (!group) return [];
    return group.memberIds.map(id => {
      const employeeResult = allResults.find(e => e.id === id)!;
      const grade = evaluations[id] || null;
      const score = grade ? gradingScale[grade].score : 0;
      
      return {
        ...employeeResult,
        grade,
        score,
      }
    });
  };
  
  const myEmployeesIds = React.useMemo(() => {
    return evaluatorGroups.flatMap(g => g.memberIds)
  }, [evaluatorGroups]);

  const gradeDistribution = Object.keys(gradingScale)
    .map(grade => ({
      name: grade,
      value: Object.entries(evaluations).filter(([empId, g]) => myEmployeesIds.includes(empId) && g === grade).length,
    }));
    
  const totalMyEmployees = summary.reduce((acc, s) => acc + s.memberCount, 0);
  const totalMyCompleted = summary.reduce((acc, s) => acc + s.completedCount, 0);
  const totalCompletionRate = totalMyEmployees > 0 ? (totalMyCompleted / totalMyEmployees) * 100 : 0;

  if (!user) return <div>로딩중...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">평가 허브</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">평가 진행 현황</CardTitle>
          <CardDescription>25년 7월 성과평가 (8월 급여반영)</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
              <div className='space-y-2'>
                <div className='flex justify-between items-baseline'>
                    <h4 className="font-semibold">종합 진행률</h4>
                    <span className="font-bold text-lg text-primary">{totalCompletionRate.toFixed(1)}%</span>
                </div>
                <Progress value={totalCompletionRate} />
                <p className="text-sm text-muted-foreground text-right">{totalMyCompleted} / {totalMyEmployees} 명 완료</p>
              </div>

            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>그룹</TableHead>
                    <TableHead>완료/전체</TableHead>
                    <TableHead>현재/총점</TableHead>
                    <TableHead>잔여 점수</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {summary.map(s => (
                    <TableRow key={s.id} className={s.isOverScore ? 'bg-destructive/10' : ''}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.completedCount}/{s.memberCount}</TableCell>
                    <TableCell className={s.isOverScore ? 'font-bold text-destructive' : ''}>{s.currentScore}/{s.totalScore}</TableCell>
                    <TableCell className={s.isOverScore ? 'font-bold text-destructive' : ''}>{s.remainingScore}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {isSaveDisabled && (
                <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>총점 초과</AlertTitle>
                <AlertDescription>
                    "현재 점수"가 모든 그룹의 "총점"보다 낮거나 같아야 저장할 수 있습니다.
                </AlertDescription>
                </Alert>
            )}
          </div>
          <div className="lg:col-span-3">
             <GradeHistogram data={gradeDistribution} title="나의 등급 분포" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {evaluatorGroups.map(group => (
             <Card key={group.id}>
                <CardHeader><CardTitle>{group.name} - 평가 시트 (총점: {group.totalScore})</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                    <TableHeader><TableRow>
                        <TableHead>사번</TableHead>
                        <TableHead>이름</TableHead>
                        <TableHead>직책급</TableHead>
                        <TableHead>근무율</TableHead>
                        <TableHead>등급</TableHead>
                        <TableHead>점수</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                        {getGroupMembers(group.id).map(emp => (
                            <TableRow key={emp.id}>
                                <TableCell>{emp.id}</TableCell>
                                <TableCell className="font-medium">{emp.name}</TableCell>
                                <TableCell>{emp.title || emp.growthLevel}</TableCell>
                                <TableCell>{(emp.workRate * 100).toFixed(1)}%</TableCell>
                                <TableCell>
                                <Select value={evaluations[emp.id] || ''} onValueChange={(g: Grade) => handleGradeChange(emp.id, g)}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue placeholder="등급 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {Object.keys(gradingScale).map(grade => (
                                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                </TableCell>
                                <TableCell>{emp.score}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
             </Card>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={isSaveDisabled} size="lg">
            <Check className="mr-2"/> 모든 평가 저장
        </Button>
      </div>
    </div>
  );
}
