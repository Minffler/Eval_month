'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useEvaluation } from '@/contexts/evaluation-context';
import type { EvaluationResult, Grade, GradeInfo, User, EvaluatorView, Holiday, AttendanceType, Approval, AppNotification, ApprovalStatus, WorkRateInputs, Evaluation } from '@/lib/types';
import { useNotifications } from '@/contexts/notification-context';
import AllResultsView from './evaluator-dashboard-all-results';
import AssignmentManagementView from './evaluator-dashboard-assignment-management';
import WorkRateManagement from './work-rate-management';
import WorkRateDetails from './work-rate-details';
import EvaluatorNotifications from './evaluator-dashboard-notifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Inbox, Trash2, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { GradeHistogram } from './grade-histogram';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '../ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent as AlertDialogContent2, AlertDialogDescription, AlertDialogFooter as AlertDialogFooter2, AlertDialogHeader as AlertDialogHeader2, AlertDialogTitle as AlertDialogTitle2 } from '../ui/alert-dialog';


interface EvaluationInputViewProps {
    myEmployees: EvaluationResult[];
    gradingScale: Record<NonNullable<Grade>, GradeInfo>;
    selectedDate: { year: number; month: number };
    onClearMyEvaluations: (year: number, month: number) => void;
    onSave: (evaluations: EvaluationResult[]) => void;
}

function EvaluationInputView({ myEmployees, gradingScale, selectedDate, onClearMyEvaluations, onSave }: EvaluationInputViewProps) {
    const [evaluations, setEvaluations] = React.useState<EvaluationResult[]>(myEmployees);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        setEvaluations(myEmployees);
    }, [myEmployees]);
    
    const handleGradeChange = (employeeId: string, grade: Grade) => {
        setEvaluations(prev =>
            prev.map(e => (e.id === employeeId ? { ...e, grade } : e))
        );
    };

    const handleMemoChange = (employeeId: string, memo: string) => {
        setEvaluations(prev =>
            prev.map(e => (e.id === employeeId ? { ...e, memo } : e))
        );
    };

    const handleSaveChanges = () => {
        onSave(evaluations);
        toast({
            title: '저장 완료',
            description: `${selectedDate.year}년 ${selectedDate.month}월 평가 결과가 저장되었습니다.`,
        });
    };
    
    const gradeDistribution = React.useMemo(() => {
        const counts = evaluations.reduce((acc, result) => {
            if (result.grade) {
                acc[result.grade] = (acc[result.grade] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(gradingScale).map(grade => ({
            name: grade,
            value: counts[grade] || 0,
        }));
    }, [evaluations, gradingScale]);

    const handleConfirmClear = () => {
        onClearMyEvaluations(selectedDate.year, selectedDate.month);
        setIsClearConfirmOpen(false);
        toast({
            title: '초기화 완료',
            description: '담당 직원의 평가 데이터가 모두 초기화되었습니다.',
            variant: 'destructive'
        });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>등급 분포 현황</CardTitle>
                    <CardDescription>
                        현재 내가 평가한 등급의 분포를 확인합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <GradeHistogram data={gradeDistribution} gradingScale={gradingScale} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <CardTitle>평가 입력</CardTitle>
                      <CardDescription>담당 직원의 등급과 비고를 입력합니다.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="destructive" onClick={() => setIsClearConfirmOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            내 평가 전체 초기화
                        </Button>
                        <Button onClick={handleSaveChanges}>
                            <Save className="mr-2 h-4 w-4" />
                            저장
                        </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">ID</TableHead>
                                    <TableHead className="text-center">이름</TableHead>
                                    <TableHead className="text-center">소속부서</TableHead>
                                    <TableHead className="text-center">직책</TableHead>
                                    <TableHead className="text-center">성장레벨</TableHead>
                                    <TableHead className="text-center w-[120px]">등급</TableHead>
                                    <TableHead className="text-center min-w-[200px]">비고</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {evaluations.map(employee => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="text-center">{employee.uniqueId}</TableCell>
                                        <TableCell className="text-center">{employee.name}</TableCell>
                                        <TableCell className="text-center">{employee.department}</TableCell>
                                        <TableCell className="text-center">{employee.title}</TableCell>
                                        <TableCell className="text-center">{employee.growthLevel}</TableCell>
                                        <TableCell className="text-center">
                                            <Select value={employee.grade || ''} onValueChange={(g) => handleGradeChange(employee.id, g as Grade)}>
                                                <SelectTrigger className="w-full h-8">
                                                    <SelectValue placeholder="선택" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">-</SelectItem>
                                                    {Object.keys(gradingScale).map(g => (
                                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                value={employee.memo || ''}
                                                onChange={(e) => handleMemoChange(employee.id, e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

             <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <AlertDialogContent2>
                    <AlertDialogHeader2>
                        <AlertDialogTitle2>내 평가 전체 초기화</AlertDialogTitle2>
                        <AlertDialogDescription>
                            정말로 {selectedDate.year}년 {selectedDate.month}월의 내가 평가한 모든 등급과 비고를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader2>
                    <AlertDialogFooter2>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmClear}>확인</AlertDialogAction>
                    </AlertDialogFooter2>
                </AlertDialogContent2>
            </AlertDialog>
        </div>
    );
}

interface EvaluatorDashboardProps {
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  evaluatorUser?: User | null;
  activeView: EvaluatorView;
  userMap: Map<string, User>;
  setEvaluations?: React.Dispatch<React.SetStateAction<Record<string, Evaluation[]>>>;
}

export default function EvaluatorDashboard({ selectedDate, setSelectedDate, evaluatorUser, activeView, userMap, setEvaluations: setEvaluationsProp }: EvaluatorDashboardProps) {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const { 
    monthlyEvaluationTargets,
    allEvaluationResults,
    gradingScale, 
    handleClearMyEvaluations,
    workRateInputs, 
    holidays,
    attendanceTypes,
    setEvaluations: setEvaluationsFromContext,
  } = useEvaluation();
  const { notifications, deleteNotification, approvals, handleApprovalAction } = useNotifications();

  const setEvaluations = setEvaluationsProp || setEvaluationsFromContext;

  const [effectiveUser, setEffectiveUser] = React.useState<User | null>(null);
  const [approvalDetailModalOpen, setApprovalDetailModalOpen] = React.useState(false);
  const [selectedApproval, setSelectedApproval] = React.useState<Approval | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  
  React.useEffect(() => {
    if (evaluatorUser) {
        setEffectiveUser(evaluatorUser);
    } else {
        setEffectiveUser(authUser);
    }
  }, [evaluatorUser, authUser]);
  
  const myEmployees = React.useMemo(() => {
    if (!effectiveUser) return [];
    const targets = monthlyEvaluationTargets(selectedDate);
    return targets.filter(r => r.evaluatorId === effectiveUser.uniqueId);
  }, [effectiveUser, monthlyEvaluationTargets, selectedDate]);
  
  const currentMonthResults = monthlyEvaluationTargets(selectedDate);

  const handleSave = (updatedEvaluations: EvaluationResult[]) => {
    const key = `${selectedDate.year}-${selectedDate.month}`;
    const allGroupMembers = [...myEmployees, ...updatedEvaluations];
    const memberMap = new Map(allGroupMembers.map(m => [m.id, m]));

    setEvaluations(prevEvals => {
        const newState = JSON.parse(JSON.stringify(prevEvals));
        const newEvalsForMonth = newState[key] ? [...newState[key]] : [];
        
        updatedEvaluations.forEach(updatedEval => {
            const index = newEvalsForMonth.findIndex((e: Evaluation) => e.employeeId === updatedEval.id);
            if (index > -1) {
                newEvalsForMonth[index].grade = updatedEval.grade;
                newEvalsForMonth[index].memo = updatedEval.memo;
            } else {
                 newEvalsForMonth.push({
                    id: `eval-${updatedEval.id}-${selectedDate.year}-${selectedDate.month}`,
                    employeeId: updatedEval.id,
                    year: selectedDate.year,
                    month: selectedDate.month,
                    grade: updatedEval.grade,
                    memo: updatedEval.memo,
                });
            }
        });
        
        newState[key] = newEvalsForMonth;
        return newState;
    });
  };
  
    const formatTimestamp = (isoString: string | null) => {
        if (!isoString) return '-';
        return format(new Date(isoString), 'yyyy.MM.dd HH:mm');
    };
    
    const formatTimestampShort = (isoString: string | null) => {
        if (!isoString) return '-';
        return format(new Date(isoString), 'MM.dd HH:mm');
    };

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
    
    const handleApprovalModal = (approval: Approval) => {
        setSelectedApproval(approval);
        setRejectionReason('');
        setApprovalDetailModalOpen(true);
    };

    const handleApprovalDecision = (decision: 'approved' | 'rejected') => {
        if (!selectedApproval) return;

        if (decision === 'rejected' && !rejectionReason.trim()) {
            toast({ variant: 'destructive', title: '오류', description: '반려 사유를 입력해주세요.' });
            return;
        }
        
        let newStatus = selectedApproval.status;
        if (decision === 'approved') {
            newStatus = '현업승인';
        } else {
            newStatus = '반려';
        }
        
        onApprovalAction({ 
            ...selectedApproval,
            rejectionReason,
            status: newStatus,
        });
        
        toast({ title: '처리 완료', description: `결재 요청이 ${decision === 'approved' ? '승인' : '반려'}되었습니다.` });
        setApprovalDetailModalOpen(false);
        setSelectedApproval(null);
    };

    const renderApprovalData = (approval: Approval) => {
        const { payload } = approval;
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
    }

    const teamApproverInfo = React.useMemo(() => {
        if (!selectedApproval) return null;
        
        const approver = userMap.get(selectedApproval.approverTeamId);
        return approver ? `${approver.name} (${approver.uniqueId})` : `미지정 (${selectedApproval.approverTeamId})`;
    }, [selectedApproval, userMap]);


  if (!effectiveUser) return <div className="p-4 md:p-6 lg:p-8">로딩중...</div>;

  const renderContent = () => {
    switch(activeView) {
      case 'evaluation-input':
        return <EvaluationInputView 
                  myEmployees={myEmployees} 
                  gradingScale={gradingScale}
                  selectedDate={selectedDate}
                  onClearMyEvaluations={(year, month) => handleClearMyEvaluations(year, month, effectiveUser!.uniqueId)}
                  onSave={handleSave}
                />;
      case 'all-results':
        return <AllResultsView currentMonthResults={currentMonthResults} gradingScale={gradingScale} />;
      case 'assignment-management':
        return <AssignmentManagementView 
                 myEmployees={myEmployees} 
                 currentMonthResults={currentMonthResults}
                 evaluatorId={effectiveUser.uniqueId}
                 evaluatorName={effectiveUser.name}
               />;
      case 'work-rate-view':
          return <WorkRateManagement results={myEmployees} workRateInputs={workRateInputs} selectedDate={selectedDate} holidays={holidays} attendanceTypes={attendanceTypes} />;
      case 'shortened-work-details':
          return <WorkRateDetails type="shortenedWork" data={Array.from(userMap.values())} selectedDate={selectedDate} attendanceTypes={attendanceTypes} viewAs="evaluator" workRateInputs={workRateInputs}/>;
      case 'daily-attendance-details':
          return <WorkRateDetails type="dailyAttendance" data={Array.from(userMap.values())} selectedDate={selectedDate} attendanceTypes={attendanceTypes} viewAs="evaluator" workRateInputs={workRateInputs}/>;
      case 'approvals': {
            const myApprovals = approvals.filter(a => a.approverTeamId === effectiveUser.uniqueId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return (
              <Card>
                <CardHeader>
                  <CardTitle>결재함</CardTitle>
                  <CardDescription>현업 리더로서 결재를 기다리는 요청 목록입니다.</CardDescription>
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
                              const approver = userMap.get(approval.approverTeamId);
                              return (
                                <TableRow key={approval.id}>
                                  <TableCell className="text-center text-muted-foreground">{formatTimestamp(approval.date)}</TableCell>
                                  <TableCell className="text-center">{`${approval.payload.data.name} (${approval.payload.data.uniqueId})`}</TableCell>
                                  <TableCell className="text-center">{approver ? `${approver.name} (${approver.uniqueId})` : '미지정'}</TableCell>
                                  <TableCell className="text-center">
                                     <Button variant="link" className="underline text-foreground" onClick={() => handleApprovalModal(approval)}>
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
                        <p className="text-muted-foreground">새로운 결재가 없습니다.</p>
                   </div>
                  )}
                </CardContent>
              </Card>
            )
        }
      case 'notifications':
          return <EvaluatorNotifications notifications={notifications} deleteNotification={deleteNotification} />;
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
      <Dialog open={approvalDetailModalOpen} onOpenChange={setApprovalDetailModalOpen}>
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
                        {renderApprovalData(selectedApproval)}
                    </div>
                    {selectedApproval.status === '반려' && selectedApproval.rejectionReason && (
                        <div>
                            <Label htmlFor="rejectionReason" className="text-destructive mb-1 block">현업 반려 사유</Label>
                            <p className="text-sm text-destructive p-2 border border-destructive rounded-md">{selectedApproval.rejectionReason}</p>
                        </div>
                    )}
                    {selectedApproval.statusHR === '반려' && selectedApproval.rejectionReason && (
                        <div>
                            <Label htmlFor="rejectionReason" className="text-destructive mb-1 block">인사부 반려 사유</Label>
                            <p className="text-sm text-destructive p-2 border border-destructive rounded-md">{selectedApproval.rejectionReason}</p>
                        </div>
                    )}
                    {(selectedApproval.status === '결재중') && (
                         <div>
                            <Label htmlFor="rejectionReason" className="mb-1 block">반려 사유 (반려 시 필수)</Label>
                            <Textarea id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                        </div>
                    )}
                </div>
            )}
            <DialogFooter className="sm:justify-between items-center pt-2">
                 <div className="text-sm text-muted-foreground">
                    {teamApproverInfo && <p>현업 결재자: <span className="font-semibold text-foreground">{teamApproverInfo}</span></p>}
                </div>
                {selectedApproval && selectedApproval.status === '결재중' ? (
                  <div className="flex gap-2">
                      <Button variant="destructive" onClick={() => handleApprovalDecision('rejected')}>반려</Button>
                      <Button onClick={() => handleApprovalDecision('approved')}>승인</Button>
                  </div>
                ) : (
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setApprovalDetailModalOpen(false)}>닫기</Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
