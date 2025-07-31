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
import { ApprovalList } from './approval-list';
import { ApprovalDetailDialog } from './approval-detail-dialog';
import { StatusBadge } from './status-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Inbox, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { cn, formatDateTime } from '@/lib/utils';
import { log } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';
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
  usePerformanceMonitor('EvaluatorDashboard');
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
  log.group('EvaluatorDashboard Debug');
  log.debug('gradingScale:', gradingScale);
  log.debug('gradingScale type:', typeof gradingScale);
  log.debug('gradingScale keys:', Object.keys(gradingScale || {}));
  log.debug('gradingScale length:', Object.keys(gradingScale || {}).length);
  log.debug('gradingScale is null:', gradingScale === null);
  log.debug('gradingScale is undefined:', gradingScale === undefined);
  log.debug('gradingScale is empty object:', gradingScale && Object.keys(gradingScale).length === 0);
  log.groupEnd();
  const { notifications, deleteNotification, approvals, handleApprovalAction, deleteApproval, resubmitApproval } = useNotifications();

  const setEvaluations = setEvaluationsProp || setEvaluationsFromContext;

  const [effectiveUser, setEffectiveUser] = React.useState<User | null>(null);
  const [approvalDetailModalOpen, setApprovalDetailModalOpen] = React.useState(false);
  const [selectedApproval, setSelectedApproval] = React.useState<Approval | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  
  // 평가자별 그룹 정보 관리 (평가자 변경 시에도 유지)
  const [evaluatorCustomGroups, setEvaluatorCustomGroups] = React.useState<Record<string, Record<string, string[]>>>({});
  
  React.useEffect(() => {
    if (evaluatorUser) {
        setEffectiveUser(evaluatorUser);
    } else {
        setEffectiveUser(authUser);
    }
  }, [evaluatorUser, authUser]);
  
  const myEmployees = React.useMemo(() => {
    log.time('myEmployees 계산');
    
    if (!effectiveUser?.uniqueId) {
      log.debug('effectiveUser가 없음, 빈 배열 반환');
      log.timeEnd('myEmployees 계산');
      return [];
    }
    
    const targets = monthlyEvaluationTargets(selectedDate);
    log.debug('monthlyEvaluationTargets 결과:', targets.length);
    
    const filtered = targets.filter(r => r.evaluatorId === effectiveUser.uniqueId);
    log.debug('필터링 후 결과:', filtered.length);
    
    log.timeEnd('myEmployees 계산');
    return filtered;
  }, [
    effectiveUser?.uniqueId, // 객체 대신 ID만
    selectedDate.year,       // 객체 대신 개별 값
    selectedDate.month
  ]);
  
  // 통계 계산 최적화
  const statistics = React.useMemo(() => {
    log.time('통계 계산');
    
    const total = myEmployees.length;
    const completed = myEmployees.filter(e => e.grade).length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    
    const result = { total, completed, rate };
    log.timeEnd('통계 계산');
    log.debug('통계 결과:', result);
    
    return result;
  }, [myEmployees]);

  const currentMonthResults = monthlyEvaluationTargets(selectedDate);

  const handleSave = React.useCallback((updatedEvaluations: EvaluationResult[]) => {
    const key = `${selectedDate.year}-${selectedDate.month}`;
    
    log.debug('handleSave 호출됨:', {
      key,
      evaluationsCount: updatedEvaluations.length,
      date: selectedDate
    });
    
    setEvaluations(prevEvals => {
        const newState = JSON.parse(JSON.stringify(prevEvals));
        const newEvalsForMonth = newState[key] ? [...newState[key]] : [];
        
        updatedEvaluations.forEach(updatedEvaluation => {
            const index = newEvalsForMonth.findIndex((e: Evaluation) => e.employeeId === updatedEvaluation.uniqueId);
            if (index > -1) {
                newEvalsForMonth[index].grade = updatedEvaluation.grade;
                newEvalsForMonth[index].memo = updatedEvaluation.memo;
                newEvalsForMonth[index].score = updatedEvaluation.score;
                newEvalsForMonth[index].detailedGroup2 = updatedEvaluation.detailedGroup2 || '';
            } else {
                 newEvalsForMonth.push({
                    id: `eval-${updatedEvaluation.uniqueId}-${selectedDate.year}-${selectedDate.month}`,
                    employeeId: updatedEvaluation.uniqueId,
                    year: selectedDate.year,
                    month: selectedDate.month,
                    grade: updatedEvaluation.grade,
                    memo: updatedEvaluation.memo,
                    score: updatedEvaluation.score,
                    detailedGroup2: updatedEvaluation.detailedGroup2 || '',
                });
            }
        });
        
        newState[key] = newEvalsForMonth;
        return newState;
    });
  }, [selectedDate, setEvaluations]);
  
  const formatTimestamp = React.useCallback((isoString: string | null) => {
    return formatDateTime(isoString || undefined);
  }, []);
    
  const formatTimestampShort = React.useCallback((isoString: string | null) => {
    return formatDateTime(isoString || undefined);
  }, []);


    
  const handleApprovalModal = React.useCallback((approval: Approval) => {
        setSelectedApproval(approval);
        setApprovalDetailModalOpen(true);
  }, []);

  // handleApprovalDecision 함수 제거 - useApproval 훅에서 처리

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
                  evaluatorId={effectiveUser?.uniqueId ?? ''}
                  customGroups={evaluatorCustomGroups[effectiveUser?.uniqueId ?? ''] || {}}
                  onCustomGroupsChange={(newCustomGroups) => {
                    setEvaluatorCustomGroups(prev => ({
                      ...prev,
                      [effectiveUser?.uniqueId ?? '']: newCustomGroups
                    }));
                  }}
          />
        );
      case 'all-results':
        return (
          <AllResultsView 
            currentMonthResults={currentMonthResults} 
            allEmployees={currentMonthResults}
            gradingScale={gradingScale} 
            handleResultsUpdate={handleSave}
            currentEvaluatorId={effectiveUser?.uniqueId}
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
               
                 }}
                                             evaluatorId={effectiveUser?.uniqueId ?? ''}
                 evaluatorName={effectiveUser?.name || ''}
                 addNotification={(notification) => {
                   // 알림 추가 로직 구현
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
            currentEvaluatorId={effectiveUser?.uniqueId}
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
            currentEvaluatorId={effectiveUser?.uniqueId}
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
        const myApprovals = approvals.filter(a => a.approverTeamId === effectiveUser?.uniqueId || null).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
                                 <Button variant="link" className="underline text-foreground" onClick={() => handleApprovalModal(approval)}>
                                  {approval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} 데이터 {approval.payload.action === 'add' ? '추가' : '변경'}
                                 </Button>
                              </TableCell>
                              <TableCell className="text-center">{approver ? `${approver.name} (${approver.uniqueId})` : '미지정'}</TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.status} className="scale-90" /></TableCell>
                              <TableCell className="text-center"><StatusBadge status={approval.statusHR} className="scale-90" /></TableCell>
                              <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtTeam || null)}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{formatTimestampShort(approval.approvedAtHR || null)}</TableCell>
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

      <ApprovalDetailDialog
        approval={selectedApproval}
        isOpen={approvalDetailModalOpen}
        onClose={() => {
          setApprovalDetailModalOpen(false);
          setSelectedApproval(null);
        }}
        onApprovalAction={handleApprovalAction}
        onDeleteApproval={deleteApproval}
        onResubmitApproval={resubmitApproval}
        userRole="evaluator"
        currentUserId={effectiveUser?.uniqueId || ''}
        userMap={userMap}
      />
    </div>
  );
}
