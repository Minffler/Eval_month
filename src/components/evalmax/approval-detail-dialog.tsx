'use client';

import * as React from 'react';
import type { Approval } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Check, X, Clock, User, FileText, FileText as Document } from 'lucide-react';
import { useEvaluation } from '@/contexts/evaluation-context';
import { useApproval } from '@/hooks/use-approval';
import { ApprovalDataRenderer } from './approval-data-renderer';

interface ApprovalDetailDialogProps {
  approval: Approval | null;
  isOpen: boolean;
  onClose: () => void;
  onApprovalAction: (approval: Approval) => void;
  onDeleteApproval?: (approvalId: string) => void;
  onResubmitApproval?: (approval: Approval) => void;
  userRole: 'admin' | 'evaluator' | 'employee';
  currentUserId: string;
  userMap?: Map<string, any>;
}

export function ApprovalDetailDialog({
  approval,
  isOpen,
  onClose,
  onApprovalAction,
  onDeleteApproval,
  onResubmitApproval,
  userRole,
  currentUserId,
  userMap
}: ApprovalDetailDialogProps) {
  const { attendanceTypes } = useEvaluation();
  
  const {
    rejectionReason,
    setRejectionReason,
    isProcessing,
    isEditMode,
    setIsEditMode,
    editData,
    setEditData,
    actions,
    handleApprovalDecision,
    handleSkipFirstApproval,
    handleDelete,
    handleResubmit,
  } = useApproval({
    approval,
    userRole,
    currentUserId,
    onApprovalAction,
    onDeleteApproval,
    onResubmitApproval
  });



  if (!approval) return null;

  // 커스텀 훅에서 가져온 actions 사용
  const { canApprove, canSkip, canDelete, canResubmit } = actions || {};

  const renderEditForm = () => {
    if (!approval || !editData) return null;
    
    const { payload } = approval;
    
    if (payload.dataType === 'shortenedWorkHours') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">단축근로 유형</Label>
              <select
                value={editData.type || ''}
                onChange={(e) => setEditData({...editData, type: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">선택하세요</option>
                <option value="육아/돌봄">육아/돌봄</option>
                <option value="임신">임신</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">시작일</Label>
              <input
                type="date"
                value={editData.startDate || ''}
                onChange={(e) => setEditData({...editData, startDate: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">종료일</Label>
              <input
                type="date"
                value={editData.endDate || ''}
                onChange={(e) => setEditData({...editData, endDate: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">출근시각</Label>
              <input
                type="time"
                value={editData.startTime || '09:00'}
                onChange={(e) => setEditData({...editData, startTime: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">퇴근시각</Label>
              <input
                type="time"
                value={editData.endTime || '18:00'}
                onChange={(e) => setEditData({...editData, endTime: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      );
    } else if (payload.dataType === 'dailyAttendance') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">일근태 유형</Label>
              <select
                value={editData.type || ''}
                onChange={(e) => setEditData({...editData, type: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">선택하세요</option>
                {attendanceTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">사용일자</Label>
              <input
                type="date"
                value={editData.date || ''}
                onChange={(e) => setEditData({...editData, date: e.target.value})}
                className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
                    <Dialog open={isOpen} onOpenChange={onClose}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogDescription className="sr-only">
                      결재 상세 정보를 확인하고 처리할 수 있습니다.
                    </DialogDescription>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Document className="h-5 w-5" />
            결재 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 요청 정보 */}
          <div>
            <div className="mb-3">
              <h3 className="text-lg font-semibold">요청 정보</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">요청자:</span> {approval.requesterName} ({approval.requesterId})
                </div>
                              <div>
                <span className="font-medium">요청일시:</span> <span className="text-muted-foreground">{format(new Date(approval.date), 'yyyy. M. d HH:mm')}</span>
              </div>
              </div>
              <div>
                <span className="font-medium">요청내용:</span> {approval.payload.dataType === 'shortenedWorkHours' ? '단축근로' : '일근태'} {approval.payload.action === 'add' ? '추가' : approval.payload.action === 'edit' ? '수정' : '삭제'}
              </div>
              <div>
                <span className="font-medium">변경 내용:</span>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  {isEditMode ? renderEditForm() : <ApprovalDataRenderer approval={approval} />}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 결재 상태 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">결재 상태</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">1차 현업 결재:</span>
                  <span className="text-muted-foreground">
                    {userMap?.get(approval.approverTeamId)?.name || approval.approverTeamId} ({approval.approverTeamId})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {approval.status === '결재중' ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (approval.approvedAtTeam || approval.status === '반려') && (
                    <span className="text-muted-foreground">
                      {format(new Date(approval.approvedAtTeam || approval.date), 'yyyy. M. d HH:mm')}
                    </span>
                  )}
                  <StatusBadge status={approval.status} className="scale-90" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">2차 인사부 결재:</span>
                  <span className="text-muted-foreground">관리자 (admin)</span>
                </div>
                <div className="flex items-center gap-2">
                  {approval.statusHR === '결재중' ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (approval.approvedAtHR || approval.statusHR === '반려') && (
                    <span className="text-muted-foreground">
                      {format(new Date(approval.approvedAtHR || approval.date), 'yyyy. M. d HH:mm')}
                    </span>
                  )}
                  <StatusBadge status={approval.statusHR} className="scale-90" />
                </div>
              </div>
            </div>
          </div>

          {/* 반려 사유 */}
          {(approval.status === '반려' || approval.statusHR === '반려') && approval.rejectionReason && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 text-destructive">반려 사유</h3>
                <div className="p-3 border border-destructive rounded-md bg-destructive/10">
                  <p className="text-sm text-destructive">{approval.rejectionReason}</p>
                </div>
              </div>
            </>
          )}

          {/* 결재 처리 */}
          {canApprove && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">결재 처리</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="rejection-reason" className="text-sm font-medium">
                      반려 사유 (반려 시 필수)
                    </Label>
                    <Textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="반려 사유를 입력하세요..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        handleApprovalDecision('approved');
                        onClose();
                      }}
                      disabled={isProcessing}
                    >
                      승인
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleApprovalDecision('rejected');
                        onClose();
                      }}
                      disabled={isProcessing || !rejectionReason.trim()}
                    >
                      반려
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 1차 결재 생략 옵션 */}
                        {canSkip && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">관리자 옵션</h3>
                <Button
                  onClick={() => {
                    handleSkipFirstApproval();
                    onClose();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  1차 결재 생략 후 최종승인
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {canDelete && onDeleteApproval && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDelete();
                  onClose();
                }}
              >
                삭제
              </Button>
            )}
            {canResubmit && onResubmitApproval && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log('재상신 버튼 클릭됨:', { canResubmit, onResubmitApproval: !!onResubmitApproval, isEditMode });
                  handleResubmit();
                  // 상신 버튼 클릭 시에만 팝업창 닫기
                  if (isEditMode) {
                    onClose();
                  }
                }}
              >
                {isEditMode ? '상신' : '재상신'}
              </Button>
            )}
            {isEditMode && (
              <Button
                variant="outline"
                onClick={() => setIsEditMode(false)}
              >
                취소
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 