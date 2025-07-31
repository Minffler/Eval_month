'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { EvaluationResult, Grade, GradeInfo, Employee, EmployeeView, AttendanceType, Approval, ApprovalStatus, AppNotification, WorkRateInputs } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Inbox, ChevronsUpDown, CalendarIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WorkRateManagement from './work-rate-management';
import WorkRateDetails from './work-rate-details';
import EmployeeNotifications from './employee-dashboard-notifications';
import { cn, formatDateTime } from '@/lib/utils';
import { format, isValid, parse } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useNotifications } from '@/contexts/notification-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyPerformanceReview from './my-performance-review';
import MyHallOfFame from './my-hall-of-fame';
import DetailedEvaluationView from './detailed-evaluation-view';
import { useEvaluation } from '@/contexts/evaluation-context';
import { DatePickerWithInput, TimePicker } from './employee/date-time-pickers';
import { ApprovalList } from './approval-list';
import { ApprovalDetailDialog } from './approval-detail-dialog';
import { StatusBadge } from './status-badge';

interface EmployeeDashboardProps {
  employeeResults: EvaluationResult[];
  allResultsForYear: EvaluationResult[];
  allResultsForMonth: EvaluationResult[];
  activeView: EmployeeView;
  workRateInputs: Record<string, WorkRateInputs>;
  selectedDate: { year: number, month: number };
  onApprovalAction: (approval: Approval) => void;
  notifications: AppNotification[];
  deleteNotification: (notificationId: string) => void;
  approvals: Approval[];
}



const formatTimestamp = (isoString: string | null) => {
    return formatDateTime(isoString || undefined);
};

const formatTimestampShort = (isoString: string | null) => {
    return formatDateTime(isoString || undefined);
};

export default function EmployeeDashboard({ 
    employeeResults, 
    allResultsForYear,
    allResultsForMonth,
    activeView, 
    workRateInputs, 
    selectedDate, 
    onApprovalAction,
    notifications,
    approvals,
    deleteNotification
}: EmployeeDashboardProps) {
  const { user, role, userMap } = useAuth();
  const { toast } = useToast();
  const { addApproval, deleteApproval, resubmitApproval } = useNotifications();
  const [isApprovalModalOpen, setIsApprovalModalOpen] = React.useState(false);
  const [selectedApproval, setSelectedApproval] = React.useState<Approval | null>(null);
  const [formData, setFormData] = React.useState<any>({});
  const { gradingScale, attendanceTypes } = useEvaluation();

  if (!user) {
    return <div>결과를 불러오는 중입니다...</div>;
  }
  
  const handleApprovalModalOpen = React.useCallback((approval: Approval) => {
    setSelectedApproval(approval);
    setFormData(approval.payload.data);
    setIsApprovalModalOpen(true);
  }, []);
  
  const handleResubmit = React.useCallback(() => {
    if (!selectedApproval) return;

    const resubmittedApproval: Approval = {
        ...selectedApproval,
        status: '결재중',
        statusHR: '결재중',
        date: new Date().toISOString(),
        isRead: false,
        rejectionReason: '',
        approvedAtTeam: null,
        approvedAtHR: null,
        payload: {
            ...selectedApproval.payload,
            data: formData,
        }
    };
    
    onApprovalAction(resubmittedApproval);
    toast({ title: '재상신 완료', description: '결재 요청이 다시 제출되었습니다.' });
    setIsApprovalModalOpen(false);
  }, [selectedApproval, formData, onApprovalAction, toast]);
  
  const handleFormChange = React.useCallback((field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const renderApprovalData = React.useCallback(() => {
    if (!selectedApproval) return null;

    const { payload } = selectedApproval;
    const data = payload.data;

    const commonFields = [
      { label: '대상자', value: `${data.name} (${data.uniqueId})` },
    ];

    const typeSpecificFields = payload.dataType === 'shortenedWorkHours' ? [
      { label: '유형', value: `단축근로 (${data.type})` },
      { label: '사용기간', value: `${data.startDate} ~ ${data.endDate}` },
      { label: '근무시간', value: `${data.startTime} ~ ${data.endTime}` },
    ] : [
      { label: '유형', value: `일근태 (${data.type})` },
      { label: '사용일자', value: data.date },
    ];

        return (
             <div className="text-sm space-y-4">
        {[...commonFields, ...typeSpecificFields].map(field => (
          <div key={field.label} className="grid grid-cols-4 items-center">
            <span className="font-semibold col-span-1">{field.label}</span>
            <span className="col-span-3">{field.value}</span>
                </div>
        ))}
            </div>
        );
  }, [selectedApproval]);

  const renderContent = React.useCallback(() => {
    switch(activeView) {
      case 'my-work-rate':
        return (
          <WorkRateManagement 
            results={employeeResults} 
            workRateInputs={workRateInputs} 
            selectedDate={selectedDate} 
            holidays={[]}
            attendanceTypes={attendanceTypes}
          />
        );
      case 'my-shortened-work':
        return (
          <WorkRateDetails 
            type="shortenedWork" 
            data={employeeResults} 
            selectedDate={selectedDate} 
            attendanceTypes={attendanceTypes} 
            viewAs={role} 
            workRateInputs={workRateInputs}
            allEmployees={employeeResults}
            onDataChange={() => {}}
          />
        );
      case 'my-daily-attendance':
            return (
          <WorkRateDetails 
            type="dailyAttendance" 
            data={employeeResults} 
            selectedDate={selectedDate} 
            attendanceTypes={attendanceTypes} 
            viewAs={role} 
            workRateInputs={workRateInputs}
            allEmployees={employeeResults}
            onDataChange={() => {}}
          />
        );
      case 'notifications':
        return (
          <EmployeeNotifications 
            notifications={notifications} 
            deleteNotification={deleteNotification} 
          />
        );
      case 'approvals': {
        const myApprovals = approvals.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return (
          <Card>
            <CardHeader>
              <CardTitle>결재함</CardTitle>
              <CardDescription>최근 결재 내역입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {myApprovals.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-center">요청일</TableHead>
                      <TableHead className="text-center">대상자 (ID)</TableHead>
                      <TableHead className="text-center">요청내용</TableHead>
                      <TableHead className="text-center">현업 결재자</TableHead>
                      <TableHead className="text-center">현업 결재</TableHead>
                      <TableHead className="text-center">인사부 결재</TableHead>
                      <TableHead className="text-center">현업 승인일</TableHead>
                      <TableHead className="text-center">최종 승인일</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {myApprovals.map(approval => {
                          const approver = Array.from(userMap.values()).find(u => u.uniqueId === approval.approverTeamId);
                          return (
                            <TableRow key={approval.id}>
                              <TableCell className="text-center text-muted-foreground">{formatTimestamp(approval.date)}</TableCell>
                              <TableCell className="text-center">{`${approval.payload.data.name} (${approval.payload.data.uniqueId})`}</TableCell>
                              <TableCell className="text-center">
                                 <Button variant="link" className="underline text-foreground" onClick={() => handleApprovalModalOpen(approval)}>
                                  {approval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {approval.payload.action === 'add' ? '추가' : '변경'}
                                 </Button>
                              </TableCell>
                              <TableCell className="text-center">{approver ? `${approver.name} (${approver.uniqueId})` : '미지정'}</TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.status} className="scale-90" /></TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.statusHR} className="scale-90" /></TableCell>
                              <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtTeam)}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtHR)}</TableCell>
                            </TableRow>
                          )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                 <div className="flex flex-col items-center justify-center h-40 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">새로운 결재내역이 없습니다.</p>
               </div>
              )}
            </CardContent>
          </Card>
        )
      }
      case 'my-review':
        return (
          <div className="space-y-6">
          <MyPerformanceReview 
              allResultsForYear={allResultsForMonth} 
              selectedDate={selectedDate}
            gradingScale={gradingScale} 
          />
            <MyHallOfFame 
              allResultsForYear={allResultsForYear}
            />
          </div>
        );
      case 'evaluation-details':
        return (
          <DetailedEvaluationView 
            allResultsForYear={allResultsForYear} 
            gradingScale={gradingScale} 
            selectedDate={selectedDate}
          />
        );
      default:
        return <div>선택된 뷰를 찾을 수 없습니다.</div>;
    }
  }, [
    activeView, 
    employeeResults, 
    workRateInputs, 
    selectedDate, 
    userMap, 
    attendanceTypes, 
    role, 
    notifications, 
    deleteNotification, 
    onApprovalAction, 
    allResultsForYear, 
    allResultsForMonth,
    gradingScale,
    approvals,
    handleApprovalModalOpen
  ]);

  return (
    <div className="space-y-4">
      {renderContent()}
      <ApprovalDetailDialog
        approval={selectedApproval}
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedApproval(null);
        }}
        onApprovalAction={onApprovalAction}
        onDeleteApproval={deleteApproval}
        onResubmitApproval={resubmitApproval}
        userRole="employee"
        currentUserId={user?.uniqueId || ''}
        userMap={userMap}
      />
    </div>
  );
}
