'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileCheck, Bot, Upload, LayoutDashboard, Settings, Download, Bell, ArrowUpDown, ArrowUp, ArrowDown, Eye, ClipboardX } from 'lucide-react';
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
import type { EvaluationResult, Grade, Employee, GradeInfo, Evaluation, EvaluationGroupCategory, User } from '@/lib/types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import GradeManagement from './grade-management';
import { MonthSelector } from './month-selector';
import { calculateFinalAmount, mockUsers, mockEmployees } from '@/lib/data';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import EvaluatorDashboard from './evaluator-dashboard';

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

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

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
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = React.useState(false);
  const [notificationMessage, setNotificationMessage] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = React.useState<string>('');
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
    const statsById: Record<string, { total: number; completed: number; evaluatorName: string; evaluatorUniqueId: string }> = {};

    initialResults.forEach(r => {
      if (!r.evaluatorId) return;

      const id = r.evaluatorId;
      const name = r.evaluatorName || '미지정';

      if (!statsById[id]) {
        const evaluatorUser = mockUsers.find(u => u.id === id);
        const evaluatorEmployee = evaluatorUser ? mockEmployees.find(e => e.id === evaluatorUser.employeeId) : null;
        const uniqueId = evaluatorEmployee ? evaluatorEmployee.uniqueId : 'N/A';
        statsById[id] = { total: 0, completed: 0, evaluatorName: name, evaluatorUniqueId: uniqueId };
      }
      statsById[id].total++;
      if (r.grade) {
        statsById[id].completed++;
      }
    });

    return Object.entries(statsById).map(([id, data]) => ({
      evaluatorId: id,
      evaluatorUniqueId: data.evaluatorUniqueId,
      evaluatorName: data.evaluatorName,
      total: data.total,
      completed: data.completed,
      pending: data.total - data.completed,
      rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    })).sort((a, b) => a.evaluatorName.localeCompare(b.evaluatorName));
  }, [initialResults]);
  
  const isAllEvaluatorsSelected = evaluatorStats.length > 0 && selectedEvaluators.size === evaluatorStats.length;
  const isIndeterminateEvaluatorSelection = selectedEvaluators.size > 0 && !isAllEvaluatorsSelected;

  const selectedEvaluator = React.useMemo(() => {
    if (!selectedEvaluatorId) return null;
    return mockUsers.find(u => u.id === selectedEvaluatorId) || null;
  }, [selectedEvaluatorId]);

  const sortedVisibleResults = React.useMemo(() => {
    let sortableItems = [...visibleResults];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [visibleResults, sortConfig]);

  const requestSort = (key: keyof EvaluationResult) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof EvaluationResult) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

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
  
  const handleSelectIncompleteEvaluators = () => {
    const incompleteEvaluatorIds = evaluatorStats
      .filter(stat => stat.rate < 100)
      .map(stat => stat.evaluatorId);
    setSelectedEvaluators(new Set(incompleteEvaluatorIds));
    if (incompleteEvaluatorIds.length > 0) {
      toast({
          title: "선택 완료",
          description: `완료율이 100%가 아닌 ${incompleteEvaluatorIds.length}명의 평가자가 선택되었습니다.`,
      });
    } else {
      toast({
          title: "모두 완료",
          description: `모든 평가자가 평가를 완료했습니다.`,
      });
    }
  };

  const handleOpenNotificationDialog = () => {
    setNotificationMessage(`<평가년월> 평가 마감 3일 전입니다. (현재 진행률 <%>`);
    setIsNotificationDialogOpen(true);
  };
  
  const handleSendNotifications = () => {
    const monthYearString = `${selectedDate.year}년 ${selectedDate.month}월`;
    selectedEvaluators.forEach(evaluatorId => {
        const stat = evaluatorStats.find(s => s.evaluatorId === evaluatorId);
        if (stat) {
            const message = notificationMessage
                .replace(/<평가자이름>/g, stat.evaluatorName)
                .replace(/<%>%/g, `${stat.rate.toFixed(1)}%`)
                .replace(/<평가년월>/g, monthYearString);
            // In a real app, you would send this message via email, Slack, etc.
            console.log(`Sending to ${stat.evaluatorName}: ${message}`);
        }
    });

    toast({
        title: "알림 발송 완료",
        description: `${selectedEvaluators.size}명의 평가자에게 알림이 발송되었습니다.`,
    });
    
    setIsNotificationDialogOpen(false);
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
      '직책/성장레벨': ['팀장', '지점장', '센터장', '지부장'].includes(r.position) ? r.title : r.growthLevel,
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
    XLSX.writeFile(workbook, `PL월성과평가_${selectedDate.year}_${selectedDate.month}_결과.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">관리자 개요</h2>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </div>
      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" /> 대시보드
          </TabsTrigger>
          <TabsTrigger value="results">
            <FileCheck className="mr-2 h-4 w-4" /> 전체 결과
          </TabsTrigger>
          <TabsTrigger value="evaluator-view">
            <Eye className="mr-2 h-4 w-4" /> 평가자별 현황
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
          <GradeHistogram data={overallGradeDistribution} gradingScale={gradingScale} />
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
                          checked={isIndeterminateEvaluatorSelection ? 'indeterminate' : isAllEvaluatorsSelected}
                          onCheckedChange={(checked) => handleSelectAllEvaluators(Boolean(checked))}
                          aria-label="모든 평가자 선택"
                        />
                      </TableHead>
                      <TableHead className="whitespace-nowrap">평가자사번</TableHead>
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
                        <TableCell className="whitespace-nowrap font-mono text-xs">{stat.evaluatorUniqueId}</TableCell>
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
              <div className="flex justify-end mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={handleSelectIncompleteEvaluators}
                  size="sm"
                >
                  <ClipboardX className="mr-2 h-4 w-4" />
                  미완료 평가자 선택
                </Button>
                <Button
                  disabled={selectedEvaluators.size === 0}
                  onClick={handleOpenNotificationDialog}
                  size="sm"
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
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('uniqueId')}>
                    <div className="flex items-center">고유사번 {getSortIcon('uniqueId')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('company')}>
                     <div className="flex items-center">회사 {getSortIcon('company')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('department')}>
                    <div className="flex items-center">소속부서 {getSortIcon('department')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('name')}>
                    <div className="flex items-center">이름 {getSortIcon('name')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('title')}>
                    <div className="flex items-center">직책/성장레벨 {getSortIcon('title')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('workRate')}>
                    <div className="flex items-center">근무율 {getSortIcon('workRate')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('score')}>
                    <div className="flex items-center">점수 {getSortIcon('score')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('grade')}>
                    <div className="flex items-center">등급 {getSortIcon('grade')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('baseAmount')}>
                    <div className="flex items-center">기준금액 {getSortIcon('baseAmount')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('gradeAmount')}>
                    <div className="flex items-center">등급금액 {getSortIcon('gradeAmount')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('finalAmount')}>
                    <div className="flex items-center">최종금액 {getSortIcon('finalAmount')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => requestSort('evaluatorName')}>
                    <div className="flex items-center">평가자 {getSortIcon('evaluatorName')}</div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap min-w-[200px]">비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVisibleResults.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="py-1 px-2 whitespace-nowrap">{r.uniqueId}</TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap">{r.company}</TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap">{r.department}</TableCell>
                      <TableCell className="py-1 px-2 font-medium whitespace-nowrap">{r.name}</TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap">
                        {['팀장', '지점장', '센터장', '지부장'].includes(r.position)
                          ? r.title
                          : r.growthLevel}
                      </TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap">{(r.workRate * 100).toFixed(1)}%</TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap">{r.score}</TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap">
                        <Select value={r.grade || ''} onValueChange={(g) => handleGradeChange(r.id, g)}>
                            <SelectTrigger className="w-[80px] h-8">
                                <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent>
                            {Object.keys(gradingScale).map(grade => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap">
                        <Input 
                          type="text"
                          defaultValue={formatCurrency(r.baseAmount)}
                          onBlur={(e) => handleBaseAmountChange(r.id, e.target.value)}
                          className="w-28 text-right h-8"
                        />
                      </TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap text-right">{formatCurrency(r.gradeAmount)}</TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap text-right">{formatCurrency(r.finalAmount)}</TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap">{r.evaluatorName}</TableCell>
                      <TableCell className="py-1 px-2 whitespace-nowrap">
                        <Input
                          defaultValue={r.memo || ''}
                          onBlur={(e) => handleMemoChange(r.id, e.target.value)}
                          className="w-full h-8"
                          placeholder=''
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
        <TabsContent value="evaluator-view" className="pt-4 space-y-4">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between p-4">
                    <div>
                        <CardTitle>평가자별 현황 보기</CardTitle>
                        <CardDescription>특정 평가자의 대시보드를 확인합니다.</CardDescription>
                    </div>
                    <Select onValueChange={setSelectedEvaluatorId} value={selectedEvaluatorId}>
                        <SelectTrigger className="w-full sm:w-[280px] mt-2 sm:mt-0">
                            <SelectValue placeholder="평가자를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {evaluatorStats.map(stat => (
                                <SelectItem key={stat.evaluatorId} value={stat.evaluatorId}>
                                    {stat.evaluatorUniqueId} {stat.evaluatorName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
            </Card>

            {selectedEvaluator ? (
                <EvaluatorDashboard
                    allResults={initialResults}
                    gradingScale={gradingScale}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate} 
                    handleResultsUpdate={handleResultsUpdate}
                    evaluatorUser={selectedEvaluator}
                />
            ) : (
                <Card className="flex items-center justify-center h-64">
                  <p className="text-center text-muted-foreground">
                    평가자를 선택하면 해당 평가자의 대시보드가 여기에 표시됩니다.
                  </p>
                </Card>
            )}
        </TabsContent>
        <TabsContent value="manage-data" className="pt-4">
          <ManageData onEmployeeUpload={onEmployeeUpload} onEvaluationUpload={onEvaluationUpload} results={initialResults} />
        </TabsContent>
        <TabsContent value="grade-management" className="pt-4">
           <GradeManagement gradingScale={gradingScale} setGradingScale={setGradingScale} />
        </TabsContent>
        <TabsContent value="consistency" className="pt-4">
          <ConsistencyValidator results={initialResults} />
        </TabsContent>
      </Tabs>
      <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>알림 메시지 설정</DialogTitle>
            <DialogDescription>
              평가자에게 보낼 메시지를 입력하세요. 플레이스홀더를 사용하여 개인화할 수 있습니다: &lt;평가자이름&gt;, &lt;%&gt;, &lt;평가년월&gt;
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
                id="notification-message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                className="col-span-4 h-32"
                placeholder="알림 메시지를 입력하세요..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotificationDialogOpen(false)}>취소</Button>
            <Button onClick={handleSendNotifications}>발송</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
