'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileCheck, Bot, Upload, LayoutDashboard, Settings, Download, Bell } from 'lucide-react';
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
import type { EvaluationResult, Grade, Employee, GradeInfo, Evaluation, EvaluationGroupCategory } from '@/lib/types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import GradeManagement from './grade-management';
import { MonthSelector } from './month-selector';
import { calculateFinalAmount } from '@/lib/data';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Checkbox } from "@/components/ui/checkbox";

interface AdminDashboardProps {
  results: EvaluationResult[];
  onEmployeeUpload: (year: number, month: number, employees: Employee[]) => void;
  onEvaluationUpload: (year: number, month: number, evaluations: (Pick<Evaluation, 'employeeId' | 'grade' | 'memo'> & { baseAmount?: number | undefined })[]) => void;
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  setGradingScale: React.Dispatch<React.SetStateAction<Record<NonNullable<Grade>, GradeInfo>>>;
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  handleResultsUpdate: (updatedResults: EvaluationResult[]) => void;
}

export default function AdminDashboard({ 
  results: initialResults, 
  onEmployeeUpload,
  onEvaluationUpload,
  gradingScale, 
  setGradingScale,
  selectedDate,
  setSelectedDate,
  handleResultsUpdate
}: AdminDashboardProps) {
  const [results, setResults] = React.useState<EvaluationResult[]>(initialResults);
  const [activeTab, setActiveTab] = React.useState<EvaluationGroupCategory>('전체');
  const [selectedEvaluators, setSelectedEvaluators] = React.useState<Set<string>>(new Set());
  const { toast } = useToast();

  React.useEffect(() => {
    setResults(initialResults);
    setSelectedEvaluators(new Set());
  }, [initialResults]);

  const categorizedResults = React.useMemo(() => {
    const categories: Record<EvaluationGroupCategory, EvaluationResult[]> = {
      '전체': initialResults,
      '70% 이상': initialResults.filter(emp => emp.workRate >= 0.7 && emp.group !== '별도평가' && emp.group !== '미평가'),
      '별도평가': initialResults.filter(emp => emp.group === '별도평가'),
      '미평가': initialResults.filter(emp => emp.group === '미평가'),
    };
    return categories;
  }, [initialResults]);

  const visibleResults = categorizedResults[activeTab];
  
  const overallGradeDistribution = Object.keys(gradingScale).map(grade => ({
    name: grade,
    value: initialResults.filter(r => r.grade === grade).length,
  }));
  
  const evaluatorStats = React.useMemo(() => {
    const statsById: Record<string, { total: number; completed: number; evaluatorName: string }> = {};

    initialResults.forEach(r => {
      if (!r.evaluatorId) return;

      const id = r.evaluatorId;
      const name = r.evaluatorName || "미지정";

      if (!statsById[id]) {
        statsById[id] = { total: 0, completed: 0, evaluatorName: name };
      }
      statsById[id].total++;
      if (r.grade) {
        statsById[id].completed++;
      }
    });

    return Object.entries(statsById).map(([id, data]) => ({
      evaluatorId: id,
      evaluatorName: data.evaluatorName,
      total: data.total,
      completed: data.completed,
      pending: data.total - data.completed,
      rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    }));
  }, [initialResults]);

  const handleSelectAllEvaluators = (checked: boolean) => {
    if (checked) {
      const allEvaluatorIds = new Set(evaluatorStats.map(s => s.evaluatorId));
      setSelectedEvaluators(allEvaluatorIds);
    } else {
      setSelectedEvaluators(new Set());
    }
  };

  const handleSelectEvaluator = (evaluatorId: string, checked: boolean) => {
    const newSelection = new Set(selectedEvaluators);
    if (checked) {
      newSelection.add(evaluatorId);
    } else {
      newSelection.delete(evaluatorId);
    }
    setSelectedEvaluators(newSelection);
  };
  
  const handleSendNotification = () => {
    toast({
        title: "알림 발송",
        description: `${selectedEvaluators.size}명의 평가자에게 알림이 발송되었습니다.`,
    });
    setSelectedEvaluators(new Set());
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  const updateAndSaveChanges = (updatedResults: EvaluationResult[]) => {
    setResults(updatedResults);
    handleResultsUpdate(updatedResults);
  };
  
  const handleBaseAmountChange = (employeeId: string, newAmountStr: string) => {
    const newAmount = Number(newAmountStr.replace(/,/g, ''));
    if (isNaN(newAmount)) return;

    const updatedResults = results.map(r => {
      if (r.id === employeeId) {
        const gradeInfo = r.grade ? gradingScale[r.grade] : { payoutRate: 0 };
        const payoutRate = (gradeInfo?.payoutRate || 0) / 100;
        const gradeAmount = newAmount * payoutRate;
        const finalAmount = calculateFinalAmount(gradeAmount, r.workRate);
        return { ...r, baseAmount: newAmount, gradeAmount, finalAmount };
      }
      return r;
    });
    updateAndSaveChanges(updatedResults);
  };
  
  const handleMemoChange = (employeeId: string, newMemo: string) => {
    const updatedResults = results.map(r => {
      if (r.id === employeeId) {
        return { ...r, memo: newMemo };
      }
      return r;
    });
    updateAndSaveChanges(updatedResults);
  };

  const handleGradeChange = (employeeId: string, newGradeStr: string) => {
    const newGrade = newGradeStr as Grade;
    const updatedResults = results.map(r => {
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
    });
    updateAndSaveChanges(updatedResults);
  };

  const handleDownloadExcel = () => {
    const dataToExport = visibleResults.map(r => ({
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

        <TabsContent value="dashboard" className="space-y-6 pt-6">
          <GradeHistogram data={overallGradeDistribution} title="전체 등급 분포" />
          <Card>
            <CardHeader>
              <CardTitle>평가자별 진행 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedEvaluators.size === evaluatorStats.length && evaluatorStats.length > 0}
                          onCheckedChange={(checked) => handleSelectAllEvaluators(Boolean(checked))}
                          aria-label="모든 평가자 선택"
                        />
                      </TableHead>
                      <TableHead className="whitespace-nowrap">평가자</TableHead>
                      <TableHead className="whitespace-nowrap text-center">대상 인원</TableHead>
                      <TableHead className="whitespace-nowrap text-center">완료</TableHead>
                      <TableHead className="whitespace-nowrap text-center">미입력</TableHead>
                      <TableHead className="whitespace-nowrap text-center w-[200px]">완료율</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluatorStats.map(stat => (
                      <TableRow key={stat.evaluatorId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEvaluators.has(stat.evaluatorId)}
                            onCheckedChange={(checked) => handleSelectEvaluator(stat.evaluatorId, Boolean(checked))}
                            aria-label={`${stat.evaluatorName} 선택`}
                          />
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{stat.evaluatorName}</TableCell>
                        <TableCell className="text-center whitespace-nowrap">{stat.total}</TableCell>
                        <TableCell className="text-center whitespace-nowrap">{stat.completed}</TableCell>
                        <TableCell className="text-center whitespace-nowrap">{stat.pending}</TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={stat.rate} className="w-full h-2" />
                            <span className="text-muted-foreground text-xs w-16 text-right">{stat.rate.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  disabled={selectedEvaluators.size === 0}
                  onClick={handleSendNotification}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  선택된 평가자에게 알림 발송
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="pt-4">
          <Tabs defaultValue="전체" onValueChange={(val) => setActiveTab(val as EvaluationGroupCategory)}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
                {Object.keys(categorizedResults).map(category => (
                    <TabsTrigger key={category} value={category}>{category} ({categorizedResults[category as EvaluationGroupCategory].length})</TabsTrigger>
                ))}
            </TabsList>
            
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
                  <TableHead className="whitespace-nowrap min-w-[200px]">비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleResults.map(r => (
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
                          defaultValue={formatCurrency(r.baseAmount)}
                          onBlur={(e) => handleBaseAmountChange(r.id, e.target.value)}
                          className="w-32 text-right"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">{formatCurrency(r.gradeAmount)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{formatCurrency(r.finalAmount)}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.evaluatorName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Input
                          defaultValue={r.memo || ''}
                          onBlur={(e) => handleMemoChange(r.id, e.target.value)}
                          placeholder="비고 입력"
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
            </div>
          </Tabs>
        </TabsContent>
        <TabsContent value="manage-data" className="pt-4">
          <ManageData onEmployeeUpload={onEmployeeUpload} onEvaluationUpload={onEvaluationUpload} results={initialResults} />
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
