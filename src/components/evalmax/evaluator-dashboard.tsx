'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { EvaluationResult, Grade, GradeInfo } from '@/lib/types';
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
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MonthSelector } from './month-selector';
import { GradeHistogram } from './grade-histogram';

interface EvaluatorDashboardProps {
  allResults: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
}

export default function EvaluatorDashboard({ allResults, gradingScale, selectedDate, setSelectedDate }: EvaluatorDashboardProps) {
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

  const myEmployees = React.useMemo(() => {
    if (!user) return [];
    return allResults.filter(r => r.evaluatorId === user.id);
  }, [user, allResults]);

  React.useEffect(() => {
    const initialState: Record<string, Grade> = {};
    myEmployees.forEach(ev => {
      if (ev.grade) {
        initialState[ev.id] = ev.grade;
      }
    });
    setEvaluations(initialState);
  }, [myEmployees]);

  const categorizedEmployees = React.useMemo(() => {
    const categories: Record<string, EvaluationResult[]> = {
      '70% 이상': [],
      '별도평가': [],
      '미평가': [],
    };

    myEmployees.forEach(emp => {
      if (emp.group === '미평가') {
        categories['미평가'].push(emp);
      } else if (emp.group === '별도평가') {
        categories['별도평가'].push(emp);
      } else if (emp.workRate >= 0.7) {
        categories['70% 이상'].push(emp);
      }
    });
    return categories;
  }, [myEmployees]);

  const groupWithinCategory = (employees: EvaluationResult[]) => {
    return employees.reduce((acc, emp) => {
      const groupKey = emp.title || emp.growthLevel || '기타';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(emp);
      return acc;
    }, {} as Record<string, EvaluationResult[]>);
  };

  const handleGradeChange = (employeeId: string, grade: Grade) => {
    setEvaluations(prev => ({ ...prev, [employeeId]: grade }));
  };

  const handleSave = () => {
    // Here you would typically send the data to a server
    console.log('Saving evaluations:', evaluations);
    toast({
      title: '성공!',
      description: '평가가 성공적으로 저장되었습니다.',
      action: <Check className="text-green-500" />,
    });
  };
  
  const gradeDistribution = Object.keys(gradingScale)
    .map(grade => ({
      name: grade,
      value: Object.values(evaluations).filter(g => g === grade).length,
    }));
    
  const totalMyEmployees = myEmployees.length;
  const totalMyCompleted = Object.values(evaluations).filter(g => g !== null).length;
  const totalCompletionRate = totalMyEmployees > 0 ? (totalMyCompleted / totalMyEmployees) * 100 : 0;

  if (!user) return <div>로딩중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">평가 허브</h2>
        <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">평가 진행 현황</CardTitle>
          <CardDescription>{selectedDate.year}년 {selectedDate.month}월 성과평가 ({(selectedDate.month % 12) + 1}월 급여반영)</CardDescription>
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
          </div>
          <div className="lg:col-span-3">
             <GradeHistogram data={gradeDistribution} title="나의 등급 분포" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="70% 이상">
        <TabsList>
            {Object.keys(categorizedEmployees).map(category => (
                <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
        </TabsList>
        {Object.entries(categorizedEmployees).map(([category, employees]) => (
            <TabsContent key={category} value={category} className="pt-4">
                {employees.length > 0 ? Object.entries(groupWithinCategory(employees)).map(([groupName, groupMembers]) => (
                    <Card key={groupName} className="mb-6">
                        <CardHeader><CardTitle>{groupName}</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow>
                                    <TableHead className="whitespace-nowrap">고유사번</TableHead>
                                    <TableHead className="whitespace-nowrap">회사</TableHead>
                                    <TableHead className="whitespace-nowrap">이름</TableHead>
                                    <TableHead className="whitespace-nowrap">근무율</TableHead>
                                    <TableHead className="whitespace-nowrap">등급</TableHead>
                                    <TableHead className="whitespace-nowrap">점수</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {groupMembers.map(emp => {
                                        const grade = evaluations[emp.id] || null;
                                        const score = grade ? gradingScale[grade]?.score || 0 : 0;
                                        return (
                                            <TableRow key={emp.id}>
                                                <TableCell className="whitespace-nowrap">{emp.uniqueId}</TableCell>
                                                <TableCell className="whitespace-nowrap">{emp.company}</TableCell>
                                                <TableCell className="font-medium whitespace-nowrap">{emp.name}</TableCell>
                                                <TableCell className="whitespace-nowrap">{(emp.workRate * 100).toFixed(1)}%</TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                <Select value={grade || ''} onValueChange={(g: Grade) => handleGradeChange(emp.id, g)}>
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
                                                <TableCell className="whitespace-nowrap">{score}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )) : (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">이 분류에 해당하는 평가 대상자가 없습니다.</p>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} size="lg">
            <Check className="mr-2"/> 모든 평가 저장
        </Button>
      </div>
    </div>
  );
}
