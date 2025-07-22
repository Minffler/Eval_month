'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { EvaluationResult, Grade, GradeInfo, Employee, EmployeeView, AttendanceType, Approval, ApprovalStatus, AppNotification, WorkRateInputs } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Inbox, ChevronsUpDown, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WorkRateManagement from './work-rate-management';
import WorkRateDetails from './work-rate-details';
import EmployeeNotifications from './employee-dashboard-notifications';
import { cn } from '@/lib/utils';
import { format, isValid, parse } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { useNotifications } from '@/contexts/notification-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyPerformanceReview from './my-performance-review';
import DetailedEvaluationView from './detailed-evaluation-view';
import { useEvaluation } from '@/contexts/evaluation-context';


const DatePickerWithInput = ({ value, onChange, disabled }: { value: string, onChange: (date?: string) => void, disabled?: boolean }) => {
    const [date, setDate] = React.useState<Date | undefined>(value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined);
    const [inputValue, setInputValue] = React.useState<string>(value || '');
    const [popoverOpen, setPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        if (value && isValid(parse(value, 'yyyy-MM-dd', new Date()))) {
            setDate(parse(value, 'yyyy-MM-dd', new Date()));
            setInputValue(value);
        } else if (!value) {
            setDate(undefined);
            setInputValue('');
        }
    }, [value]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        if (selectedDate) {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            setInputValue(formattedDate);
            onChange(formattedDate);
        } else {
            setInputValue('');
            onChange(undefined);
        }
        setPopoverOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let text = e.target.value.replace(/[^0-9]/g, '');
        if (text.length > 4) text = `${text.slice(0, 4)}-${text.slice(4)}`;
        if (text.length > 7) text = `${text.slice(0, 7)}-${text.slice(7)}`;
        setInputValue(text.slice(0, 10));
    };

    const handleInputBlur = () => {
        const parsedDate = parse(inputValue, 'yyyy-MM-dd', new Date());
        if (isValid(parsedDate)) {
            const formattedDate = format(parsedDate, 'yyyy-MM-dd');
            if (inputValue !== formattedDate) {
                setInputValue(formattedDate);
            }
            setDate(parsedDate);
            onChange(formattedDate);
        } else if (inputValue === '') {
            setDate(undefined);
            onChange(undefined);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="YYYY-MM-DD"
                className="w-full"
                disabled={disabled}
            />
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" disabled={disabled}>
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

const TimePicker = ({ value, onChange, disabled }: { value: string, onChange: (time: string) => void, disabled?: boolean }) => {
    const [hour, minute] = React.useMemo(() => {
        if (!value || !value.includes(':')) return ['', ''];
        const parts = value.split(':');
        return [parts[0] || '', parts[1] || ''];
    }, [value]);

    const handleTimeChange = (part: 'hour' | 'minute', partValue: string) => {
        const newHour = part === 'hour' ? partValue : hour;
        const newMinute = part === 'minute' ? partValue : minute;
        onChange(`${newHour}:${newMinute}`);
    };
    
    const hours = Array.from({ length: 14 }, (_, i) => String(i + 7).padStart(2, '0')); // 07 to 20
    const minutes = ['00', '15', '30', '45'];

    return (
        <div className="flex gap-2 items-center w-full">
            <Select value={hour} onValueChange={(val) => handleTimeChange('hour', val)} disabled={disabled}>
                <SelectTrigger className="w-full"><SelectValue placeholder="시" /></SelectTrigger>
                <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}시</SelectItem>)}</SelectContent>
            </Select>
            <Select value={minute} onValueChange={(val) => handleTimeChange('minute', val)} disabled={disabled}>
                <SelectTrigger className="w-full"><SelectValue placeholder="분" /></SelectTrigger>
                <SelectContent>{minutes.map(m => <SelectItem key={m} value={m}>{m}분</SelectItem>)}</SelectContent>
            </Select>
        </div>
    )
}

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

const formatTimestampShort = (isoString: string | null) => {
    if (!isoString) return '-';
    return format(new Date(isoString), 'MM.dd HH:mm');
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
  
  const handleApprovalModalOpen = (approval: Approval) => {
    setSelectedApproval(approval);
    setFormData(approval.payload.data);
    setIsApprovalModalOpen(true);
  };
  
  const handleResubmit = () => {
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
  }
  
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const isRejected = selectedApproval?.status === '반려' || selectedApproval?.statusHR === '반려';

  const renderApprovalData = () => {
    if (!selectedApproval) return null;
    const { payload } = selectedApproval;

    const data = formData as any;

    if (payload.dataType === 'shortenedWorkHours') {
        return (
            <div className="text-sm space-y-4">
                 <div className="grid grid-cols-4 items-center">
                    <Label className="font-semibold col-span-1">대상자</Label>
                    <span className="col-span-3">{`${data.name} (${data.uniqueId})`}</span>
                </div>
                 <div className="grid grid-cols-4 items-center">
                    <Label htmlFor="type" className="font-semibold col-span-1">유형</Label>
                    <div className="col-span-3">
                        <Select value={data.type || ''} onValueChange={(value) => handleFormChange('type', value)} disabled={!isRejected}>
                            <SelectTrigger>
                                <SelectValue placeholder="구분 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="임신">단축근로 (임신)</SelectItem>
                                <SelectItem value="육아/돌봄">단축근로 (육아/돌봄)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid grid-cols-4 items-start">
                    <Label className="font-semibold col-span-1 pt-2">사용기간</Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <DatePickerWithInput value={data.startDate || ''} onChange={(date) => handleFormChange('startDate', date)} disabled={!isRejected}/>
                        <span>~</span>
                        <DatePickerWithInput value={data.endDate || ''} onChange={(date) => handleFormChange('endDate', date)} disabled={!isRejected}/>
                    </div>
                </div>
                 <div className="grid grid-cols-4 items-start">
                    <Label className="font-semibold col-span-1 pt-2">근무시간</Label>
                    <div className="col-span-3 flex items-center gap-2">
                         <TimePicker value={data.startTime || ''} onChange={(time) => handleFormChange('startTime', time)} disabled={!isRejected}/>
                          <span>~</span>
                         <TimePicker value={data.endTime || ''} onChange={(time) => handleFormChange('endTime', time)} disabled={!isRejected}/>
                    </div>
                </div>
            </div>
        );
    }

    if (payload.dataType === 'dailyAttendance') {
        return (
             <div className="text-sm space-y-4">
                <div className="grid grid-cols-4 items-center">
                    <Label className="font-semibold col-span-1">대상자</Label>
                    <span className="col-span-3">{`${data.name} (${data.uniqueId})`}</span>
                </div>
                <div className="grid grid-cols-4 items-center">
                  <Label htmlFor="type" className="font-semibold col-span-1">유형</Label>
                  <div className="col-span-3">
                    <Select value={data.type || ''} onValueChange={(value) => handleFormChange('type', value)} disabled={!isRejected}>
                        <SelectTrigger>
                            <SelectValue placeholder="근태 종류 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            {attendanceTypes.map(type => (
                                <SelectItem key={type.id} value={type.name}>일근태 ({type.name})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start">
                  <Label className="font-semibold col-span-1 pt-2">사용일자</Label>
                  <div className="col-span-3">
                    <DatePickerWithInput value={data.date || ''} onChange={(date) => handleFormChange('date', date)} disabled={!isRejected} />
                  </div>
                </div>
            </div>
        );
    }
    return null;
  }

  const renderContent = () => {
    switch(activeView) {
      case 'my-review':
        return <MyPerformanceReview allResultsForYear={allResultsForYear} gradingScale={gradingScale} />;
      case 'evaluation-details':
        return <DetailedEvaluationView allResultsForYear={allResultsForYear} gradingScale={gradingScale} />;
      case 'my-work-rate':
        return <WorkRateManagement results={employeeResults} workRateInputs={workRateInputs} selectedDate={selectedDate} holidays={[]} attendanceTypes={attendanceTypes} />;
      case 'my-shortened-work':
        return <WorkRateDetails type="shortenedWork" data={Array.from(userMap.values())} selectedDate={selectedDate} attendanceTypes={attendanceTypes} viewAs={role} workRateInputs={workRateInputs}/>;
      case 'my-daily-attendance':
        return <WorkRateDetails type="dailyAttendance" data={Array.from(userMap.values())} selectedDate={selectedDate} attendanceTypes={attendanceTypes} viewAs={role} workRateInputs={workRateInputs}/>;
      case 'approvals': {
            const mySentApprovals = approvals.filter(a => a.requesterId === user.uniqueId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
                        <TableHead className="text-center">대상자 (ID)</TableHead>
                        <TableHead className="text-center">현업 결재자</TableHead>
                        <TableHead className="text-center">요청내용</TableHead>
                        <TableHead className="text-center">현업 결재</TableHead>
                        <TableHead className="text-center">인사부 결재</TableHead>
                        <TableHead className="text-center">현업 승인일</TableHead>
                        <TableHead className="text-center">최종 승인일</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {mySentApprovals.map(approval => {
                          const approver = userMap.get(approval.approverTeamId);
                          return (
                            <TableRow key={approval.id}>
                              <TableCell className="text-center text-muted-foreground">{formatTimestamp(approval.date)}</TableCell>
                              <TableCell className="text-center">{`${approval.payload.data.name} (${approval.payload.data.uniqueId})`}</TableCell>
                              <TableCell className="text-center">{approver ? `${approver.name} (${approver.uniqueId})` : '관리자'}</TableCell>
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
                        <Inbox className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">요청한 결재가 없습니다.</p>
                   </div>
                  )}
                </CardContent>
              </Card>
            )
        }
      case 'notifications':
          return <EmployeeNotifications notifications={notifications} deleteNotification={deleteNotification} />;
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
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>결재 상세 정보</DialogTitle>
            </DialogHeader>
            {selectedApproval && (
                <div className="space-y-4">
                    <div className='space-y-1 text-sm text-left'>
                        <p><strong>요청자:</strong> {selectedApproval.requesterName} ({selectedApproval.requesterId})</p>
                        <p><strong>요청일시:</strong> {formatTimestamp(selectedApproval.date)}</p>
                        <p><strong>요청내용:</strong> {selectedApproval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {selectedApproval.payload.action === 'add' ? '추가' : '변경'}</p>
                    </div>
                    <Separator/>
                    <div className="rounded-md border bg-muted p-4">
                        {renderApprovalData()}
                    </div>
                    {isRejected && selectedApproval.rejectionReason && (
                        <div>
                            <Label htmlFor="rejectionReason" className="text-destructive mb-1 block">반려 사유</Label>
                            <p className="text-sm text-destructive p-2 border border-destructive rounded-md">{selectedApproval.rejectionReason}</p>
                        </div>
                    )}
                </div>
            )}
            <DialogFooter className="sm:justify-end">
                {isRejected ? (
                    <Button onClick={handleResubmit}>수정 후 재상신</Button>
                ) : (
                    <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>닫기</Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
