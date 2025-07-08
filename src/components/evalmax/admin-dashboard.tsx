'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from './stats-card';
import { Users, FileCheck, AlertTriangle, CheckCircle, Bot, Upload, LayoutDashboard, Settings, Download } from 'lucide-react';
import { GradeHistogram } from './grade-histogram';
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
import { ConsistencyValidator } from './consistency-validator';
import ManageData from './manage-data';
import type { EvaluationResult, Grade, Employee, GradeInfo } from '@/lib/types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import GradeManagement from './grade-management';
import { MonthSelector } from './month-selector';
import { calculateFinalAmount, mockUsers } from '@/lib/data';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  results: EvaluationResult[];
  onEmployeeUpload: (year: number, month: number, employees: Employee[]) => void;
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  setGradingScale: React.Dispatch<React.SetStateAction<Record<NonNullable<Grade>, GradeInfo>>>;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
}

export default function AdminDashboard({ 
  results: initialResults, 
  onEmployeeUpload,
  gradingScale, 
  setGradingScale,
  selectedDate,
  setSelectedDate,
  handleResultsUpdate
}: AdminDashboardProps) {
  const [results, setResults] = React.useState<EvaluationResult[]>(initialResults);
  const { toast } = useToast();

  const [selectedEvaluatorId, setSelectedEvaluatorId] = React.useState<string>('all');
  const [selectedGroup, setSelectedGroup] = React.useState<string>('all');

  React.useEffect(() => {
    setResults(initialResults);
    setSelectedEvaluatorId('all');
    setSelectedGroup('all');
  }, [initialResults]);

  const evaluators = React.useMemo(() => {
    const evaluatorIds = new Set(initialResults.map(r => r.evaluatorId));
    return mockUsers.filter(u => evaluatorIds.has(u.id));
  }, [initialResults]);

  const evaluationGroups = React.useMemo(() => {
      const mainGroups = new Set(initialResults.map(r => r.group).filter(Boolean).map(g => `평가그룹: ${g}`));
      const subGroups = new Set(initialResults.map(r => r.detailedGroup2).filter(Boolean).map(g => `직책급: ${g}`));
      return Array.from(new Set([...mainGroups, ...subGroups])).sort();
  }, [initialResults]);

  const filteredResults = React.useMemo(() => {
    return results.filter(r => {
      const evaluatorMatch = selectedEvaluatorId === 'all' || r.evaluatorId === selectedEvaluatorId;
      const groupMatch = selectedGroup === 'all' || `평가그룹: ${r.group}` === selectedGroup || `직책급: ${r.detailedGroup2}` === selectedGroup;
      return evaluatorMatch && groupMatch;
    });
  }, [results, selectedEvaluatorId, selectedGroup]);

  const totalEmployees = filteredResults.length;
  const completedEvaluations = filteredResults.filter(r => r.grade !== null).length;
  const completionRate = totalEmployees > 0 ? (completedEvaluations / totalEmployees) * 100 : 0;
  const missingEvaluations = totalEmployees - completedEvaluations;

  const gradeDistribution = Object.keys(gradingScale).map(grade => ({
    name: grade,
    value: filteredResults.filter(r => r.grade === grade).length,
  }));

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  const handleBaseAmountChange = (employeeId: string, newAmountStr: string) => {
    const newAmount = Number(newAmountStr.replace(/,/g, ''));
    if (isNaN(newAmount)) return;

    setResults(prevResults => prevResults.map(r => {
      if (r.id === employeeId) {
        const gradeAmount = newAmount * r.payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, r.workRate);
        return { ...r, baseAmount: newAmount, gradeAmount, finalAmount };
      }
      return r;
    }));
  };
  
  const handleMemoChange = (employeeId: string, newMemo: string) => {
    setResults(prevResults => prevResults.map(r => {
      if (r.id === employeeId) {
        return { ...r, memo: newMemo };
      }
      return r;
    }));
  };

  const handleGradeChange = (employeeId: string, newGradeStr: string) => {
    const newGrade = newGradeStr as Grade;
    setResults(prevResults => prevResults.map(r => {
      if (r.id === employeeId) {
        const gradeInfo = newGrade ? gradingScale[newGrade] : { score: 0, payoutRate: 0 };
        const payoutRate = (gradeInfo?.payoutRate || 0) / 100;
        const gradeAmount = (r.baseAmount || 0) * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, r.workRate);
        return { 
          ...r, 
          grade: newGrade,
          score: gradeInfo?.score || 0,
          payoutRate: payoutRate,
          gradeAmount,
          finalAmount
        };
      }
      return r;
    }));
  };
  
  const handleSaveChanges = () => {
    handleResultsUpdate(results);
    toast({
      title: "변경사항 저장됨",
      description: `${selectedDate.year}년 ${selectedDate.month}월 평가 데이터가 성공적으로 저장되었습니다.`
    })
  }

  const handleDownloadExcel = () => {
    const dataToExport = filteredResults.map(r => ({
      '고유사번': r.uniqueId,
      '회사': r.company,
      '소속부서': r.department,
      '이름': r.name,
      '직책급': r.title || r.growthLevel,
      '근무율': `${(r.workRate * 100).toFixed(1)}%`,
      '점수': r.score,
      '등급': r.grade,
      '기준금액': r.baseAmount,
      '등급금액': r.gradeAmount,
      '최종금액': r.finalAmount,
      '평가자': r.evaluatorName,
      '비고': r.memo,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '평가결과');
    XLSX.writeFile(workbook, `evalmax_${selectedDate.year}_${selectedDate.month}_결과.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">관리자 개요</h2>
        <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedEvaluatorId} onValueChange={setSelectedEvaluatorId}>
              <SelectTrigger className="w-auto min-w-[150px]">
                <SelectValue placeholder="평가자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 평가자</SelectItem>
                {evaluators.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-auto min-w-[180px]">
                <SelectValue placeholder="그룹 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 그룹</SelectItem>
                {evaluationGroups.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </div>
      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" /> 대시보드
          </TabsTrigger>
          <TabsTrigger value="results">
            <FileCheck className="mr-2 h-4 w-4" /> 전체 결과
          </TabsTrigger>
           <TabsTrigger value="manage-data">
            <Upload className="mr-2 h-4 w-4" /> 데이터 관리
          </TabsTrigger>
          <TabsTrigger value="grade-management">
            <Settings className="mr-2 h-4 w-4" /> 등급/점수 관리
          </TabsTrigger>
          <TabsTrigger value="consistency">
            <Bot className="mr-2 h-4 w-4" /> AI 일관성 검토
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="전체 직원"
              value={totalEmployees}
              description="평가 대상 전체 직원 수"
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="완료율"
              value={`${completionRate.toFixed(1)}%`}
              description={`${completedEvaluations} / ${totalEmployees} 명 완료`}
              icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            />
            <StatsCard
              title="미제출"
              value={missingEvaluations}
              description="제출 대기중인 평가"
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            />
            <StatsCard
              title="총 지급액"
              value={`${formatCurrency(filteredResults.reduce((acc, r) => acc + r.finalAmount, 0))} 원`}
              description="예상 총 성과급 지급액"
              icon={<FileCheck className="h-4 w-4" />}
            />
          </div>
          <GradeHistogram data={gradeDistribution} title="등급 분포" />
        </TabsContent>
        <TabsContent value="results" className="pt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleDownloadExcel} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              엑셀 다운로드
            </Button>
          </div>
          <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">고유사번</TableHead>
                <TableHead className="whitespace-nowrap">회사</TableHead>
                <TableHead className="whitespace-nowrap">소속부서</TableHead>
                <TableHead className="whitespace-nowrap">이름</TableHead>
                <TableHead className="whitespace-nowrap">직책급</TableHead>
                <TableHead className="whitespace-nowrap">근무율</TableHead>
                <TableHead className="whitespace-nowrap">점수</TableHead>
                <TableHead className="whitespace-nowrap">등급</TableHead>
                <TableHead className="whitespace-nowrap">기준금액</TableHead>
                <TableHead className="whitespace-nowrap">등급금액</TableHead>
                <TableHead className="whitespace-nowrap">최종금액</TableHead>
                <TableHead className="whitespace-nowrap">평가자</TableHead>
                <TableHead className="whitespace-nowrap">비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{r.uniqueId}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.company}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.department}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{r.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.title || r.growthLevel}</TableCell>
                    <TableCell className="whitespace-nowrap">{(r.workRate * 100).toFixed(1)}%</TableCell>
                    <TableCell className="whitespace-nowrap">{r.score}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Select value={r.grade || ''} onValueChange={(g) => handleGradeChange(r.id, g)}>
                          <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="선택" />
                          </SelectTrigger>
                          <SelectContent>
                          {Object.keys(gradingScale).map(grade => (
                              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Input 
                        type="text"
                        value={formatCurrency(r.baseAmount)}
                        onBlur={(e) => handleBaseAmountChange(r.id, e.target.value)}
                        onChange={(e) => {
                           const val = e.target.value.replace(/,/g, '');
                           if (!isNaN(Number(val))) {
                               setResults(prev => prev.map(res => res.id === r.id ? {...res, baseAmount: Number(val)} : res))
                           }
                        }}
                        className="w-32 text-right"
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(r.gradeAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(r.finalAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.evaluatorName}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Input
                        value={r.memo || ''}
                        onChange={(e) => handleMemoChange(r.id, e.target.value)}
                        onBlur={handleSaveChanges}
                        placeholder="비고 입력"
                        className="w-40"
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveChanges}>변경사항 저장</Button>
          </div>
        </TabsContent>
        <TabsContent value="manage-data" className="pt-4">
          <ManageData onEmployeeUpload={onEmployeeUpload} />
        </TabsContent>
        <TabsContent value="grade-management" className="pt-4">
           <GradeManagement gradingScale={gradingScale} setGradingScale={setGradingScale} />
        </TabsContent>
        <TabsContent value="consistency" className="pt-4">
          <ConsistencyValidator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
