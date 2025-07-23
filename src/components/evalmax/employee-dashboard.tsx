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
import DetailedEvaluationView from './detailed-evaluation-view';
import { useEvaluation } from '@/contexts/evaluation-context';
import { DatePickerWithInput, TimePicker } from './employee/date-time-pickers';

interface EmployeeDashboardProps {
  employeeResults: EvaluationResult[];
  allResultsForYear: EvaluationResult[];
  activeView: EmployeeView;
  workRateInputs: Record<string, WorkRateInputs>;
  selectedDate: { year: number, month: number };
  onApprovalAction: (approval: Approval) => void;
  notifications: AppNotification[];
  deleteNotification: (notificationId: string) => void;
  approvals: Approval[];
}

const StatusBadge = React.memo(({ status }: { status: ApprovalStatus }) => {
    const styles: Record<ApprovalStatus, {bgColor: string, textColor: string}> = {
      '결재중': { bgColor: 'hsl(30, 20%, 98%)', textColor: 'hsl(var(--muted-foreground))' }, 
      '현업승인': { bgColor: 'hsl(25, 20%, 92%)', textColor: 'hsl(var(--secondary-foreground))' },
      '최종승인': { bgColor: 'hsl(140, 60%, 92%)', textColor: 'hsl(140, 80%, 30%)' }, 
      '반려': { bgColor: 'hsl(39, 94%, 94%)', textColor: 'hsl(24, 95%, 53%)'},
  };

    return (
      <div className="flex items-center justify-center">
        <div className={cn("flex items-center justify-center rounded-full text-xs font-semibold w-20 h-6")} style={{ backgroundColor: styles[status].bgColor, color: styles[status].textColor }}>
            {status}
        </div>
      </div>
    );
});

StatusBadge.displayName = 'StatusBadge';

const formatTimestamp = (isoString: string | null) => {
    return formatDateTime(isoString || undefined);
};

const formatTimestampShort = (isoString: string | null) => {
    return formatDateTime(isoString || undefined);
};

export default function EmployeeDashboard({ 
    employeeResults, 
    allResultsForYear,
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
  const { addApproval } = useNotifications();
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
            data={Array.from(userMap.values())} 
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
            data={Array.from(userMap.values())} 
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
                      <TableHead className="text-center">현업 결재자</TableHead>
                      <TableHead className="text-center">요청내용</TableHead>
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
                              <TableCell className="text-center">{approver ? `${approver.name} (${approver.uniqueId})` : '미지정'}</TableCell>
                              <TableCell className="text-center">
                                 <Button variant="link" className="underline text-foreground" onClick={() => handleApprovalModalOpen(approval)}>
                                  {approval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {approval.payload.action === 'add' ? '추가' : '변경'}
                                 </Button>
                              </TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.status} /></TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.statusHR} /></TableCell>
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
          <MyPerformanceReview 
            allResultsForYear={allResultsForYear} 
            gradingScale={gradingScale} 
          />
        );
      case 'evaluation-details':
        return (
          <DetailedEvaluationView 
            allResultsForYear={allResultsForYear} 
            gradingScale={gradingScale} 
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
    gradingScale,
    approvals,
    handleApprovalModalOpen
  ]);

  return (
    <div className="space-y-4">
      {renderContent()}

      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>결재 상세 정보</DialogTitle>
            <DialogDescription>
              반려된 결재 요청의 상세 정보를 확인하고 수정할 수 있습니다.
            </DialogDescription>
            </DialogHeader>
            {selectedApproval && (
                <div className="space-y-4">
              <div className="space-y-1 text-sm text-left">
                        <p><strong>요청자:</strong> {selectedApproval.requesterName} ({selectedApproval.requesterId})</p>
                        <p><strong>요청일시:</strong> {formatTimestamp(selectedApproval.date)}</p>
                        <p><strong>요청내용:</strong> {selectedApproval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {selectedApproval.payload.action === 'add' ? '추가' : '변경'}</p>
                    </div>
                    <Separator/>
                    <div className="rounded-md border bg-muted p-4">
                        {renderApprovalData()}
                    </div>
              {selectedApproval.status === '반려' && selectedApproval.rejectionReason && (
                        <div>
                            <Label htmlFor="rejectionReason" className="text-destructive mb-1 block">반려 사유</Label>
                            <p className="text-sm text-destructive p-2 border border-destructive rounded-md">{selectedApproval.rejectionReason}</p>
                        </div>
                    )}
              <Separator/>
              <div className="space-y-4">
                <h3 className="font-semibold">수정된 데이터</h3>
                {selectedApproval.payload.dataType === 'shortenedWorkHours' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>시작일</Label>
                      <DatePickerWithInput
                        value={formData.startDate || ''}
                        onChange={(date) => handleFormChange('startDate', date)}
                      />
                    </div>
                    <div>
                      <Label>종료일</Label>
                      <DatePickerWithInput
                        value={formData.endDate || ''}
                        onChange={(date) => handleFormChange('endDate', date)}
                      />
                    </div>
                    <div>
                      <Label>출근시각</Label>
                      <TimePicker
                        value={formData.startTime || '09:00'}
                        onChange={(time) => handleFormChange('startTime', time)}
                      />
                    </div>
                    <div>
                      <Label>퇴근시각</Label>
                      <TimePicker
                        value={formData.endTime || '18:00'}
                        onChange={(time) => handleFormChange('endTime', time)}
                      />
                    </div>
                </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>사용일자</Label>
                      <DatePickerWithInput
                        value={formData.date || ''}
                        onChange={(date) => handleFormChange('date', date)}
                      />
                    </div>
                    <div>
                      <Label>근태 종류</Label>
                      <Select value={formData.type || 'none'} onValueChange={(value) => handleFormChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="근태 종류 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">선택하세요</SelectItem>
                          {attendanceTypes.map(type => (
                            <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleResubmit}>
              재상신
            </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
