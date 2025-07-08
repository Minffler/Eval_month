'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { EvaluationResult, Grade, GradeInfo, EvaluationGroupCategory } from '@/lib/types';
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
import { Check, Download } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MonthSelector } from './month-selector';
import { GradeHistogram } from './grade-histogram';
import { Input } from '../ui/input';
import * as XLSX from 'xlsx';

interface EvaluatorDashboardProps {
  allResults: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
}

export default function EvaluatorDashboard({ allResults, gradingScale, selectedDate, setSelectedDate, handleResultsUpdate }: EvaluatorDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [localResults, setLocalResults] = React.useState<EvaluationResult[]>(allResults);
  const [activeTab, setActiveTab] = React.useState<EvaluationGroupCategory>('전체');

  React.useEffect(() => {
    setLocalResults(allResults);
  }, [allResults]);

  const myEmployees = React.useMemo(() => {
    if (!user) return [];
    return localResults.filter(r => r.evaluatorId === user.id);
  }, [user, localResults]);
  
  const categorizedEmployees = React.useMemo(() => {
    const categories: Record<EvaluationGroupCategory, EvaluationResult[]> = {
      '전체': myEmployees,
      '70% 이상': myEmployees.filter(emp => emp.workRate >= 0.7 && emp.group !== '별도평가' && emp.group !== '미평가'),
      '별도평가': myEmployees.filter(emp => emp.group === '별도평가'),
      '미평가': myEmployees.filter(emp => emp.group === '미평가'),
    };
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
  
  const handleGradeChange = (employeeId: string, newGrade: Grade) => {
    setLocalResults(prev => prev.map(res => {
      if (res.id === employeeId) {
        const score = newGrade ? gradingScale[newGrade]?.score || 0 : 0;
        return { ...res, grade: newGrade, score };
      }
      return res;
    }));
  };

  const handleMemoChange = (employeeId: string, memo: string) => {
    setLocalResults(prev => prev.map(res => res.id === employeeId ? {...res, memo} : res));
  }
  
  const handleSave = () => {
    handleResultsUpdate(localResults);
    toast({
      title: '성공!',
      description: '평가가 성공적으로 저장되었습니다.',
    });
  };
  
  const totalMyEmployees = myEmployees.length;
  const totalMyCompleted = myEmployees.filter(e => e.grade).length;
  const totalCompletionRate = totalMyEmployees > 0 ? (totalMyCompleted / totalMyEmployees) * 100 : 0;
  
  const visibleEmployees = categorizedEmployees[activeTab];

  const gradeDistribution = Object.keys(gradingScale)
    .map(grade => ({
      name: grade,
      value: visibleEmployees.filter(g => g.grade === grade).length,
    }));

  const handleDownloadExcel = () => {
    const dataToExport = visibleEmployees.map(r => ({
      '고유사번': r.uniqueId,
      '회사': r.company,
      '소속부서': r.department,
      '이름': r.name,
      '근무율': `${(r.workRate * 100).toFixed(1)}%`,
      '등급': r.grade,
      '점수': r.score,
      '비고': r.memo,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `평가결과-${activeTab}`);
    XLSX.writeFile(workbook, `evalmax_${selectedDate.year}_${selectedDate.month}_평가자결과.xlsx`);
  };

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
             <GradeHistogram data={gradeDistribution} title={`${activeTab} 등급 분포`} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="전체" onValueChange={(val) => setActiveTab(val as EvaluationGroupCategory)}>
        <TabsList className="w-full grid grid-cols-4">
            {Object.keys(categorizedEmployees).map(category => (
                <TabsTrigger key={category} value={category}>{category} ({categorizedEmployees[category as EvaluationGroupCategory].length})</TabsTrigger>
            ))}
        </TabsList>

        <div className="flex justify-end my-4">
            <Button onClick={handleDownloadExcel} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              현재 탭 엑셀 다운로드
            </Button>
        </div>

        {Object.entries(categorizedEmployees).map(([category, employees]) => (
            <TabsContent key={category} value={category} className="pt-4">
                {employees.length > 0 ? Object.entries(groupWithinCategory(employees)).map(([groupName, groupMembers]) => {
                  const availableScore = groupMembers.length * 100;
                  const usedScore = groupMembers.reduce((acc, curr) => acc + (curr.score || 0), 0);
                  
                  return (
                    <Card key={groupName} className="mb-6">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle>{groupName}</CardTitle>
                            <div className="text-sm">
                              <span className="font-semibold">그룹 점수 현황: </span>
                              <span className={usedScore > availableScore ? 'text-destructive font-bold' : ''}>{usedScore}</span>
                               / {availableScore} 점
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow>
                                    <TableHead className="whitespace-nowrap">고유사번</TableHead>
                                    <TableHead className="whitespace-nowrap">회사</TableHead>
                                    <TableHead className="whitespace-nowrap">소속부서</TableHead>
                                    <TableHead className="whitespace-nowrap">이름</TableHead>
                                    <TableHead className="whitespace-nowrap">근무율</TableHead>
                                    <TableHead className="whitespace-nowrap">등급</TableHead>
                                    <TableHead className="whitespace-nowrap">점수</TableHead>
                                    <TableHead className="whitespace-nowrap w-[200px]">비고</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {groupMembers.map(emp => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="whitespace-nowrap">{emp.uniqueId}</TableCell>
                                            <TableCell className="whitespace-nowrap">{emp.company}</TableCell>
                                            <TableCell className="whitespace-nowrap">{emp.department}</TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">{emp.name}</TableCell>
                                            <TableCell className="whitespace-nowrap">{(emp.workRate * 100).toFixed(1)}%</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                            <Select value={emp.grade || ''} onValueChange={(g: Grade) => handleGradeChange(emp.id, g)}>
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
                                            <TableCell className="whitespace-nowrap">{emp.score}</TableCell>
                                            <TableCell>
                                              <Input 
                                                value={emp.memo || ''}
                                                onChange={(e) => handleMemoChange(emp.id, e.target.value)}
                                                placeholder="메모 입력"
                                              />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                  )
                }) : (
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
