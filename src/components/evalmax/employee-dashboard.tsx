'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { EvaluationResult, Grade, GradeInfo, Employee, EmployeeView, AttendanceType, Approval, ApprovalStatus, AppNotification } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import { GradeHistogram } from './grade-histogram';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import WorkRateManagement from './work-rate-management';
import WorkRateDetails from './work-rate-details';
import type { WorkRateDetailsResult } from '@/lib/work-rate-calculator';
import EmployeeNotifications from './employee-dashboard-notifications';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EmployeeDashboardProps {
  employeeResults: EvaluationResult[];
  allResults: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
  activeView: EmployeeView;
  workRateDetails: WorkRateDetailsResult;
  selectedDate: { year: number, month: number };
  allEmployees: Employee[];
  attendanceTypes: AttendanceType[];
  onApprovalAction: (approval: Approval) => void;
  notifications: AppNotification[];
  approvals: Approval[];
}

type SortConfig = {
  key: keyof EvaluationResult;
  direction: 'ascending' | 'descending';
} | null;

const MyReviewView = ({ employeeResults, allResults, gradingScale }: {
  employeeResults: EvaluationResult[];
  allResults: EvaluationResult[];
  gradingScale: Record<NonNullable<Grade>, GradeInfo>;
}) => {
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());
  const [sortConfig, setSortConfig] = React.useState<SortConfig>(null);
  const [isChartOpen, setIsChartOpen] = React.useState(true);
  
  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };
  
  const availableYears = React.useMemo(() => {
      if (!allResults) return [];
      const years = new Set(allResults.map(r => r.year));
      return Array.from(years).sort((a,b) => b - a);
  }, [allResults]);

  const filteredResults = React.useMemo(() => {
    return employeeResults.filter(r => r.year.toString() === selectedYear);
  }, [employeeResults, selectedYear]);

  const sortedFilteredResults = React.useMemo(() => {
    let sortableItems = [...filteredResults];
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
  }, [filteredResults, sortConfig]);

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

  const gradeDistribution = React.useMemo(() => {
    const counts = filteredResults.reduce((acc, result) => {
        if (result.grade) {
            acc[result.grade] = (acc[result.grade] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.keys(gradingScale).map((grade) => ({
      name: grade,
      value: counts[grade] || 0,
    }));
  }, [filteredResults, gradingScale]);
  
  return (
     <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">내 성과 리뷰</h2>
         <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="연도 선택" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{selectedYear}년 평가 결과</CardTitle>
          <CardDescription>
            선택한 연도의 성과 평가 및 보상 요약입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">연간 등급 분포</h3>
               <Card>
                <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen}>
                <CollapsibleTrigger asChild>
                    <div className="flex w-full cursor-pointer items-center justify-between p-4 rounded-t-lg hover:bg-muted/50">
                        <h4 className="font-semibold">등급 분포 차트</h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <span className="sr-only">차트 보기/숨기기</span>
                            {isChartOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {gradeDistribution.some(d => d.value > 0) ? (
                    <CardContent className="pt-0">
                      <GradeHistogram data={gradeDistribution} gradingScale={gradingScale} />
                    </CardContent>
                  ) : (
                    <CardContent>
                      <div className="flex items-center justify-center h-40 rounded-lg border-dashed border-2">
                        <p className="text-muted-foreground">선택한 연도의 등급 데이터가 없습니다.</p>
                      </div>
                    </CardContent>
                  )}
                </CollapsibleContent>
                </Collapsible>
            </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">월별 상세 결과</h3>
              {sortedFilteredResults.length > 0 ? (
              <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('month')}>
                      <div className="flex items-center justify-center">평가월{getSortIcon('month')}</div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center">ID</TableHead>
                    <TableHead className="whitespace-nowrap text-center">회사</TableHead>
                    <TableHead className="whitespace-nowrap text-center">이름</TableHead>
                    <TableHead className="whitespace-nowrap text-center">소속부서</TableHead>
                    <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('workRate')}>
                      <div className="flex items-center justify-center">근무율{getSortIcon('workRate')}</div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center">평가자</TableHead>
                    <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('grade')}>
                      <div className="flex items-center justify-center">등급{getSortIcon('grade')}</div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap cursor-pointer text-center" onClick={() => requestSort('score')}>
                      <div className="flex items-center justify-center">점수{getSortIcon('score')}</div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right cursor-pointer text-center" onClick={() => requestSort('baseAmount')}>
                      <div className="flex items-center justify-center">기준금액{getSortIcon('baseAmount')}</div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right cursor-pointer text-center" onClick={() => requestSort('gradeAmount')}>
                      <div className="flex items-center justify-center">등급금액{getSortIcon('gradeAmount')}</div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right cursor-pointer text-center" onClick={() => requestSort('finalAmount')}>
                      <div className="flex items-center justify-center">최종금액{getSortIcon('finalAmount')}</div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center">비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFilteredResults.sort((a, b) => b.month - a.month).map((result) => (
                    <TableRow key={`${result.year}-${result.month}`}>
                      <TableCell className="whitespace-nowrap text-center">{result.year}년 {result.month}월</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{result.uniqueId}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{result.company}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{result.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{result.department}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{(result.workRate * 100).toFixed(1)}%</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{result.evaluatorName}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{result.grade}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{result.score}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{formatCurrency(result.baseAmount)} 원</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{formatCurrency(result.gradeAmount)} 원</TableCell>
                      <TableCell className="font-bold whitespace-nowrap text-right">{formatCurrency(result.finalAmount)} 원</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{result.memo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              ) : (
                 <p className="text-center text-muted-foreground py-8">선택한 연도에 해당하는 평가 결과가 없습니다.</p>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
    const styles: Record<ApprovalStatus, {bgColor: string, textColor: string}> = {
      '결재중': { bgColor: 'hsl(30, 20%, 98%)', textColor: 'hsl(var(--muted-foreground))' }, 
      '현업승인': { bgColor: 'hsl(25, 20%, 92%)', textColor: 'hsl(var(--secondary-foreground))' },
      '최종승인': { bgColor: 'hsl(140, 60%, 92%)', textColor: 'hsl(140, 80%, 30%)' }, 
      '반려': { bgColor: 'hsl(39, 94%, 94%)', textColor: 'hsl(24, 95%, 53%)'},
    }

    return (
      <div className="flex items-center justify-center">
        <div className={cn("flex items-center justify-center rounded-full text-xs font-semibold w-20 h-6")} style={{ backgroundColor: styles[status].bgColor, color: styles[status].textColor }}>
            {status}
        </div>
      </div>
    );
};

const formatTimestamp = (isoString: string | null) => {
    if (!isoString) return '-';
    return format(new Date(isoString), 'yyyy.MM.dd HH:mm');
};


export default function EmployeeDashboard({ 
    employeeResults, 
    allResults, 
    gradingScale, 
    activeView, 
    workRateDetails, 
    selectedDate, 
    allEmployees, 
    attendanceTypes,
    onApprovalAction,
    notifications,
    approvals
}: EmployeeDashboardProps) {
  const { user, role } = useAuth();

  if (!user) {
    return <div>결과를 불러오는 중입니다...</div>;
  }
  
  const myWorkRateDetails: WorkRateDetailsResult = {
      shortenedWorkDetails: workRateDetails.shortenedWorkDetails.filter(d => d.uniqueId === user.uniqueId),
      dailyAttendanceDetails: workRateDetails.dailyAttendanceDetails.filter(d => d.uniqueId === user.uniqueId),
  }

  const renderContent = () => {
    switch(activeView) {
      case 'my-review':
        return <MyReviewView employeeResults={employeeResults} allResults={allResults} gradingScale={gradingScale} />;
      case 'my-work-rate':
        return <WorkRateManagement results={employeeResults} workRateDetails={myWorkRateDetails} selectedDate={selectedDate} allEmployees={allEmployees} holidays={[]} handleResultsUpdate={() => {}} addNotification={() => {}} />;
      case 'my-shortened-work':
        return <WorkRateDetails type="shortenedWork" data={myWorkRateDetails.shortenedWorkDetails} selectedDate={selectedDate} allEmployees={allEmployees} attendanceTypes={attendanceTypes} viewAs={role} onDataChange={() => {}} />;
      case 'my-daily-attendance':
        return <WorkRateDetails type="dailyAttendance" data={myWorkRateDetails.dailyAttendanceDetails} selectedDate={selectedDate} allEmployees={allEmployees} attendanceTypes={attendanceTypes} viewAs={role} onDataChange={() => {}} />;
      case 'approvals': {
            const mySentApprovals = approvals.filter(a => a.requesterId === user.uniqueId);
            return (
              <Card>
                <CardHeader>
                  <CardTitle>내 결재 요청</CardTitle>
                  <CardDescription>내가 올린 근무 데이터 변경 요청 목록입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  {mySentApprovals.length > 0 ? (
                    <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead className="text-center">요청일</TableHead>
                        <TableHead className="text-center">현업 결재자</TableHead>
                        <TableHead className="text-center">요청내용</TableHead>
                        <TableHead className="text-center">현업 결재</TableHead>
                        <TableHead className="text-center">인사부 결재</TableHead>
                        <TableHead className="text-center">반려 사유</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {mySentApprovals.map(approval => {
                          const approver = allEmployees.find(e => e.uniqueId === approval.approverTeamId);
                          return (
                            <TableRow key={approval.id}>
                              <TableCell className="text-center text-muted-foreground">{formatTimestamp(approval.date)}</TableCell>
                              <TableCell className="text-center">{approver ? `${approver.name} (${approver.uniqueId})` : '관리자'}</TableCell>
                              <TableCell className="text-center">
                                  {approval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {approval.payload.action === 'add' ? '추가' : '변경'}
                              </TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.status} /></TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.statusHR} /></TableCell>
                              <TableCell className="text-center text-destructive">{approval.rejectionReason}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center h-40 text-center">
                        <Inbox className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">요청한 결재가 없습니다.</p>
                   </div>
                  )}
                </CardContent>
              </Card>
            )
        }
      case 'notifications':
          return <EmployeeNotifications notifications={notifications} />;
      default:
        return <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">새로운 알림이 없습니다.</p>
               </div>;
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {renderContent()}
    </div>
  );
}
