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
import EvaluationInputView from './evaluator/evaluation-input-view';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Inbox, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { cn, formatDateTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EvaluatorDashboardProps {
  selectedDate: { year: number; month: number };
  setSelectedDate: (date: { year: number; month: number }) => void;
  evaluatorUser?: User | null;
  activeView: EvaluatorView;
  userMap: Map<string, User>;
  setEvaluations?: React.Dispatch<React.SetStateAction<Record<string, Evaluation[]>>>;
}

export default function EvaluatorDashboard({ 
  selectedDate, 
  setSelectedDate, 
  evaluatorUser, 
  activeView, 
  userMap, 
  setEvaluations: setEvaluationsProp 
}: EvaluatorDashboardProps) {
  const { user: authUser, allUsers } = useAuth();
  const { toast } = useToast();
  const { 
    monthlyEvaluationTargets,
    allEvaluationResults,
    gradingScale, 
    handleClearMyEvaluations,
    handleEmployeeUpload,
    workRateInputs, 
    holidays,
    attendanceTypes,
    setEvaluations: setEvaluationsFromContext,
  } = useEvaluation();
  
  // 디버깅용: gradingScale 값 확인
  console.log('=== EvaluatorDashboard Debug ===');
  console.log('gradingScale:', gradingScale);
  console.log('gradingScale type:', typeof gradingScale);
  console.log('gradingScale keys:', Object.keys(gradingScale || {}));
  console.log('gradingScale length:', Object.keys(gradingScale || {}).length);
  console.log('gradingScale is null:', gradingScale === null);
  console.log('gradingScale is undefined:', gradingScale === undefined);
  console.log('gradingScale is empty object:', gradingScale && Object.keys(gradingScale).length === 0);
  console.log('================================');
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

  const handleSave = React.useCallback((updatedEvaluations: EvaluationResult[]) => {
    const key = `${selectedDate.year}-${selectedDate.month}`;
    
    console.log('=== handleSave 호출됨 ===');
    console.log('updatedEvaluations:', updatedEvaluations);
    console.log('key:', key);
    
    // 근무율이 업데이트된 경우인지 확인
    const hasWorkRateUpdate = updatedEvaluations.some(evaluation => {
      const originalResult = currentMonthResults.find(r => r.id === evaluation.id);
      return originalResult && Math.abs(evaluation.workRate - originalResult.workRate) > 0.001;
    });
    
    console.log('=== 근무율 변경 감지 디버깅 ===');
    console.log('updatedEvaluations.length:', updatedEvaluations.length);
    console.log('currentMonthResults.length:', currentMonthResults.length);
    console.log('hasWorkRateUpdate:', hasWorkRateUpdate);
    
    // 각 직원의 근무율 변경사항 상세 로그
    updatedEvaluations.forEach((result, index) => {
      const originalResult = currentMonthResults.find(r => r.id === result.id);
      if (originalResult) {
        const workRateDiff = Math.abs(result.workRate - originalResult.workRate);
        if (workRateDiff > 0.001) {
          console.log(`근무율 변경 감지: ID ${result.id} (${result.name}) - ${originalResult.workRate}% → ${result.workRate}% (차이: ${workRateDiff})`);
        }
      }
    });
    console.log('================================');
    
    setEvaluations(prevEvals => {
        const newState = JSON.parse(JSON.stringify(prevEvals));
        const newEvalsForMonth = newState[key] ? [...newState[key]] : [];
        
        updatedEvaluations.forEach(updatedEvaluation => {
            const index = newEvalsForMonth.findIndex((e: Evaluation) => e.employeeId === updatedEvaluation.id);
            if (index > -1) {
                newEvalsForMonth[index].grade = updatedEvaluation.grade;
                newEvalsForMonth[index].memo = updatedEvaluation.memo;
            } else {
                 newEvalsForMonth.push({
                    id: `eval-${updatedEvaluation.id}-${selectedDate.year}-${selectedDate.month}`,
                    employeeId: updatedEvaluation.id,
                    year: selectedDate.year,
                    month: selectedDate.month,
                    grade: updatedEvaluation.grade,
                    memo: updatedEvaluation.memo,
                });
            }
        });
        
        newState[key] = newEvalsForMonth;
        console.log('Updated evaluations state:', newState); // 디버깅용
        return newState;
    });
    
    // 근무율이 업데이트된 경우 employees 데이터도 업데이트
    if (hasWorkRateUpdate) {
      console.log('=== 근무율 업데이트 감지됨 ===');
      console.log('hasWorkRateUpdate:', hasWorkRateUpdate);
      
      // 기존 employees 데이터에서 근무율만 업데이트
      const key = `${selectedDate.year}-${selectedDate.month}`;
      
      // 업데이트된 평가 결과에서 employees 데이터 생성 (중복 제거)
      const currentEmployees = updatedEvaluations
        .filter((result, index, self) => 
          index === self.findIndex(r => r.uniqueId === result.uniqueId)
        )
        .map(result => ({
          id: result.id,
          uniqueId: result.uniqueId,
          name: result.name,
          company: result.company,
          department: result.department,
          title: result.title,
          position: result.position,
          growthLevel: result.growthLevel,
          workRate: result.workRate, // 업데이트된 근무율 (엑셀 데이터 무시)
          evaluatorId: result.evaluatorId,
          baseAmount: result.baseAmount,
          memo: result.memo,
        }));
      
      console.log('=== employees 업데이트 전 ===');
      console.log('중복 제거 후 currentEmployees 길이:', currentEmployees.length);
      console.log('currentEmployees:', currentEmployees);
      
      // handleEmployeeUpload를 사용하여 업데이트 (기존 데이터 완전 교체)
      handleEmployeeUpload(selectedDate.year, selectedDate.month, currentEmployees);
      console.log('=== handleEmployeeUpload 호출 완료 ===');
    } else {
      console.log('=== 근무율 업데이트 감지되지 않음 ===');
      console.log('hasWorkRateUpdate:', hasWorkRateUpdate);
      console.log('updatedEvaluations workRate 변경사항:');
      updatedEvaluations.forEach((result, index) => {
        const originalResult = currentMonthResults.find(r => r.id === result.id);
        if (originalResult && Math.abs(result.workRate - originalResult.workRate) > 0.001) {
          console.log(`ID ${result.id} (${result.name}): ${originalResult.workRate}% → ${result.workRate}%`);
        }
      });
    }
    
    // 저장 완료 토스트
    toast({
      title: hasWorkRateUpdate ? '근무율 반영 완료' : '저장 완료',
      description: hasWorkRateUpdate 
        ? '모든 직원의 근무율이 평가 결과에 반영되었습니다.'
        : '평가 데이터가 저장되었습니다.',
    });
  }, [selectedDate, setEvaluations, toast, currentMonthResults, handleEmployeeUpload]);
  
  const formatTimestamp = React.useCallback((isoString: string | null) => {
    return formatDateTime(isoString || undefined);
  }, []);
    
  const formatTimestampShort = React.useCallback((isoString: string | null) => {
    return formatDateTime(isoString || undefined);
  }, []);

  const StatusBadge = React.useCallback(({ status }: { status: ApprovalStatus }) => {
    const variants: Record<ApprovalStatus, string> = {
      '결재중': 'bg-yellow-100 text-yellow-800',
      '현업승인': 'bg-green-100 text-green-800',
      '최종승인': 'bg-green-100 text-green-800',
      '반려': 'bg-red-100 text-red-800',
    };
        return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', variants[status])}>
                {status}
      </span>
        );
  }, []);
    
  const handleApprovalModal = React.useCallback((approval: Approval) => {
        setSelectedApproval(approval);
        setApprovalDetailModalOpen(true);
  }, []);

  const handleApprovalDecision = React.useCallback((decision: 'approved' | 'rejected') => {
        if (!selectedApproval) return;

    const updatedApproval: Approval = {
            ...selectedApproval,
      status: decision === 'approved' ? '현업승인' : '반려',
      statusHR: decision === 'approved' ? '최종승인' : '반려',
      approvedAtTeam: decision === 'approved' ? new Date().toISOString() : null,
      approvedAtHR: decision === 'approved' ? new Date().toISOString() : null,
      rejectionReason: decision === 'rejected' ? rejectionReason : '',
      isRead: false,
    };

    handleApprovalAction(updatedApproval);
    setApprovalDetailModalOpen(false);
    setSelectedApproval(null);
    setRejectionReason('');

    toast({
      title: decision === 'approved' ? '승인 완료' : '반려 완료',
      description: decision === 'approved' 
        ? '결재가 승인되었습니다.' 
        : '결재가 반려되었습니다.',
    });
  }, [selectedApproval, rejectionReason, handleApprovalAction, toast]);

  const renderApprovalData = React.useCallback((approval: Approval) => {
    if (!approval.payload?.data) return <p>데이터가 없습니다.</p>;

    const data = approval.payload.data;
        return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="font-medium">{key}:</span>
            <span>{String(value)}</span>
                    </div>
                ))}
            </div>
        );
  }, []);

  const renderContent = React.useCallback(() => {
    switch(activeView) {
      case 'evaluation-input':
        return (
          <EvaluationInputView 
                  myEmployees={myEmployees} 
                  gradingScale={gradingScale}
                  selectedDate={selectedDate}
                  onClearMyEvaluations={(year, month) => handleClearMyEvaluations(year, month, effectiveUser!.uniqueId)}
                  onSave={handleSave}
          />
        );
      case 'all-results':
        return (
          <AllResultsView 
            currentMonthResults={currentMonthResults} 
            allEmployees={currentMonthResults}
            gradingScale={gradingScale} 
            handleResultsUpdate={handleSave}
          />
        );
      case 'assignment-management':
        return (
          <AssignmentManagementView 
                 myEmployees={myEmployees} 
                 currentMonthResults={currentMonthResults}
                 allUsers={Array.from(userMap.values())}
                 handleEvaluatorAssignmentChange={(userId, newEvaluatorId) => {
                   // 평가자 할당 변경 로직 구현
                   console.log('Evaluator assignment change:', userId, newEvaluatorId);
                 }}
                 evaluatorId={effectiveUser?.uniqueId || ''}
                 evaluatorName={effectiveUser?.name || ''}
                 addNotification={(notification) => {
                   // 알림 추가 로직 구현
                   console.log('Add notification:', notification);
                 }}
          />
        );
      case 'work-rate-view':
        return (
          <WorkRateManagement 
            results={myEmployees} 
            workRateInputs={workRateInputs} 
            selectedDate={selectedDate} 
            holidays={holidays} 
            attendanceTypes={attendanceTypes}
            gradingScale={gradingScale}
            handleResultsUpdate={handleSave}
            addNotification={(notification) => {
              // 알림 추가 로직 구현
              console.log('Add notification:', notification);
            }}
          />
        );
      case 'shortened-work-details':
        return (
          <WorkRateDetails 
            type="shortenedWork" 
            data={Array.from(userMap.values())} 
            selectedDate={selectedDate} 
            attendanceTypes={attendanceTypes} 
            viewAs="evaluator" 
            workRateInputs={workRateInputs}
            allEmployees={myEmployees}
            onDataChange={() => {}}
          />
        );
      case 'daily-attendance-details':
            return (
          <WorkRateDetails 
            type="dailyAttendance" 
            data={Array.from(userMap.values())} 
            selectedDate={selectedDate} 
            attendanceTypes={attendanceTypes} 
            viewAs="evaluator" 
            workRateInputs={workRateInputs}
            allEmployees={myEmployees}
            onDataChange={() => {}}
          />
        );
      case 'notifications':
        return (
          <EvaluatorNotifications 
            notifications={notifications} 
            deleteNotification={deleteNotification} 
            approvals={approvals} 
            handleApprovalAction={handleApprovalAction}
          />
        );
      case 'approvals': {
        const myApprovals = approvals.filter(a => a.approverTeamId === effectiveUser?.uniqueId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
                    <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">새로운 결재내역이 없습니다.</p>
               </div>
              )}
            </CardContent>
          </Card>
        )
      }
      default:
        return <div>선택된 뷰를 찾을 수 없습니다.</div>;
    }
  }, [
    activeView, 
    myEmployees, 
    gradingScale, 
    selectedDate, 
    handleClearMyEvaluations, 
    effectiveUser, 
    handleSave, 
    currentMonthResults, 
    workRateInputs, 
    holidays, 
    attendanceTypes, 
    userMap, 
    notifications, 
    deleteNotification, 
    approvals, 
    handleApprovalAction,
    formatTimestamp,
    formatTimestampShort,
    StatusBadge,
    handleApprovalModal,
    renderApprovalData,
    allUsers,
  ]);

  return (
    <div className="space-y-4">
      {renderContent()}

      <Dialog open={approvalDetailModalOpen} onOpenChange={setApprovalDetailModalOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
            <DialogTitle>결재 상세</DialogTitle>
            </DialogHeader>
            {selectedApproval && (
                <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">요청자</p>
                  <p className="text-sm text-muted-foreground">{selectedApproval.requesterName}</p>
                    </div>
                        <div>
                  <p className="text-sm font-medium">요청일</p>
                  <p className="text-sm text-muted-foreground">{formatTimestamp(selectedApproval.date)}</p>
                        </div>
                        <div>
                  <p className="text-sm font-medium">상태</p>
                  <StatusBadge status={selectedApproval.status} />
                        </div>
                         <div>
                  <p className="text-sm font-medium">결재 유형</p>
                  <p className="text-sm text-muted-foreground">{selectedApproval.payload.dataType}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">요청 내용</p>
                <div className="p-4 bg-muted rounded-lg">
                  {renderApprovalData(selectedApproval)}
                </div>
              </div>
              {selectedApproval.status === '결재중' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">반려 사유 (선택사항)</p>
                      <Input
                        placeholder="반려 사유를 입력하세요..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => handleApprovalDecision('rejected')}
                      >
                        반려
                      </Button>
                      <Button onClick={() => handleApprovalDecision('approved')}>
                        승인
                      </Button>
                    </DialogFooter>
                  </div>
                </>
              )}
            </div>
                )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
