import * as React from 'react';
import type { Approval } from '@/lib/types';
import { 
  canApproveApproval, 
  canDeleteApproval, 
  canResubmitApproval, 
  canSkipFirstApproval,
  getApprovalActions 
} from '@/lib/approval-utils';

interface UseApprovalProps {
  approval: Approval | null;
  userRole: 'admin' | 'evaluator' | 'employee';
  currentUserId: string;
  onApprovalAction: (approval: Approval) => void;
  onDeleteApproval?: (approvalId: string) => void;
  onResubmitApproval?: (approval: Approval) => void;
}

export function useApproval({
  approval,
  userRole,
  currentUserId,
  onApprovalAction,
  onDeleteApproval,
  onResubmitApproval
}: UseApprovalProps) {
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  
  // isEditMode 상태 변화 추적
  React.useEffect(() => {
    console.log('isEditMode 상태 변경:', isEditMode);
  }, [isEditMode]);
  const [editData, setEditData] = React.useState<any>(null);

  React.useEffect(() => {
    if (approval) {
      setRejectionReason(approval.rejectionReason || '');
      setEditData(approval.payload.data);
      // isEditMode는 수동으로만 변경되도록 유지
      console.log('approval 변경됨, editData 설정:', approval.payload.data);
    }
  }, [approval]);

  const actions = React.useMemo(() => {
    if (!approval) return null;
    const actions = getApprovalActions(approval, userRole, currentUserId);
    console.log('결재 액션 권한 확인:', {
      approval: {
        requesterId: approval.requesterId,
        approverHRId: approval.approverHRId,
        status: approval.status,
        statusHR: approval.statusHR
      },
      userRole,
      currentUserId,
      actions,
      canResubmit: actions.canResubmit,
      onResubmitApproval: !!onResubmitApproval
    });
    return actions;
  }, [approval, userRole, currentUserId, onResubmitApproval]);

  const handleApprovalDecision = React.useCallback(async (decision: 'approved' | 'rejected') => {
    if (!approval) return;

    console.log('결재 처리 시작:', {
      approval,
      userRole,
      currentUserId,
      decision
    });

    try {
      setIsProcessing(true);

      if (decision === 'rejected' && !rejectionReason.trim()) {
        alert('반려 사유를 입력해주세요.');
        return;
      }

      const updatedApproval: Approval = { ...approval };

      if (userRole === 'evaluator' && approval.approverTeamId === currentUserId) {
        // 1차 결재자 (현업) 처리
        updatedApproval.status = decision === 'approved' ? '현업승인' : '반려';
        updatedApproval.approvedAtTeam = decision === 'approved' ? new Date().toISOString() : null;
        updatedApproval.rejectionReason = decision === 'rejected' ? rejectionReason : '';
      } else if (userRole === 'admin') {
        // admin 처리 - 요청자인지 여부에 관계없이 처리 가능
        console.log('Admin 결재 처리:', {
          requesterId: approval.requesterId,
          currentUserId,
          approverHRId: approval.approverHRId,
          approverTeamId: approval.approverTeamId,
          status: approval.status,
          statusHR: approval.statusHR
        });
        
        // 잘못된 ID가 있는 경우 수정
        if (approval.approverHRId === '1911042') {
          updatedApproval.approverHRId = 'admin';
          console.log('approverHRId를 admin으로 수정');
        }
        if (approval.approverTeamId === '1911042') {
          updatedApproval.approverTeamId = 'admin';
          console.log('approverTeamId를 admin으로 수정');
        }
        
        // 문자열 비교 문제 완전 해결
        const isAdminApprover = userRole === 'admin' && (
          approval.approverHRId === currentUserId || 
          updatedApproval.approverHRId === currentUserId || 
          approval.approverHRId === 'admin' || 
          updatedApproval.approverHRId === 'admin' ||
          currentUserId === 'admin' ||
          (approval.approverHRId && currentUserId && approval.approverHRId.trim() === currentUserId.trim()) ||
          (updatedApproval.approverHRId && currentUserId && updatedApproval.approverHRId.trim() === currentUserId.trim())
        );
        
        console.log('Admin 결재 조건 확인:', {
          approverHRId: approval.approverHRId,
          updatedApproverHRId: updatedApproval.approverHRId,
          currentUserId,
          condition1: approval.approverHRId === currentUserId,
          condition2: updatedApproval.approverHRId === currentUserId,
          isAdminApprover,
          trimmedComparison: {
            approverHRIdTrimmed: approval.approverHRId?.trim(),
            currentUserIdTrimmed: currentUserId?.trim(),
            trimmedMatch: approval.approverHRId?.trim() === currentUserId?.trim()
          },
          typeCheck: {
            approverHRIdType: typeof approval.approverHRId,
            currentUserIdType: typeof currentUserId,
            approverHRIdLength: approval.approverHRId?.length,
            currentUserIdLength: currentUserId?.length,
            approverHRIdCharCodes: approval.approverHRId?.split('').map(c => c.charCodeAt(0)),
            currentUserIdCharCodes: currentUserId?.split('').map(c => c.charCodeAt(0))
          }
        });
        
        if (isAdminApprover) {
          // admin이 2차 결재자인 경우 (일반적인 2차 결재자 처리)
          console.log('Admin 2차 결재 처리 시작');
          updatedApproval.statusHR = decision === 'approved' ? '최종승인' : '반려';
          updatedApproval.approvedAtHR = decision === 'approved' ? new Date().toISOString() : null;
          console.log('Admin 2차 결재 처리 완료:', {
            statusHR: updatedApproval.statusHR,
            approvedAtHR: updatedApproval.approvedAtHR
          });
        } else {
          console.log('Admin이지만 승인 권한이 없음:', {
            requesterId: approval.requesterId,
            approverHRId: approval.approverHRId,
            currentUserId,
            userRole
          });
          return; // 승인 권한이 없으면 처리하지 않음
        }
        updatedApproval.rejectionReason = decision === 'rejected' ? rejectionReason : '';
      }

      console.log('결재 처리 결과:', updatedApproval);
      console.log('결재 상태 변경 확인:', {
        before: { status: approval.status, statusHR: approval.statusHR },
        after: { status: updatedApproval.status, statusHR: updatedApproval.statusHR },
        approvedAtHR: updatedApproval.approvedAtHR
      });
      console.log('onApprovalAction 호출 전');
      onApprovalAction(updatedApproval);
      console.log('onApprovalAction 호출 후');
      
      // 성공 메시지 표시
      if (typeof window !== 'undefined') {
        const message = decision === 'approved' ? '결재가 승인되었습니다.' : '결재가 반려되었습니다.';
        alert(message);
      }
    } catch (error) {
      console.error('결재 처리 중 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [approval, userRole, currentUserId, rejectionReason, onApprovalAction]);

  const handleSkipFirstApproval = React.useCallback(() => {
    if (!approval) return;

    if (confirm('1차 결재(현업승인)를 건너뛰고 바로 최종승인하시겠습니까?')) {
      const updatedApproval: Approval = {
        ...approval,
        status: '현업승인',
        statusHR: '최종승인',
        approvedAtTeam: new Date().toISOString(),
        approvedAtHR: new Date().toISOString(),
      };

      console.log('1차 결재 생략 처리:', updatedApproval);
      onApprovalAction(updatedApproval);
    }
  }, [approval, onApprovalAction]);

  const handleDelete = React.useCallback(() => {
    if (!approval || !onDeleteApproval) return;

    if (confirm('이 결재 내역을 삭제하시겠습니까?')) {
      onDeleteApproval(approval.id);
    }
  }, [approval, onDeleteApproval]);

  const handleResubmit = React.useCallback(() => {
    if (!approval) return;

    console.log('handleResubmit 호출됨:', {
      isEditMode,
      onResubmitApproval: !!onResubmitApproval,
      approval: {
        requesterId: approval.requesterId,
        currentUserId,
        status: approval.status,
        statusHR: approval.statusHR
      }
    });

    if (!isEditMode) {
      // 수정 모드로 전환
      console.log('수정 모드로 전환 - setIsEditMode(true) 호출');
      setIsEditMode(true);
      console.log('setIsEditMode(true) 호출 완료');
    } else {
      // 실제 재상신 처리
      console.log('재상신 처리 시작');
      if (onResubmitApproval) {
        const updatedApproval = {
          ...approval,
          payload: {
            ...approval.payload,
            data: editData
          }
        };
        console.log('재상신 데이터:', updatedApproval);
        onResubmitApproval(updatedApproval);
      } else {
        console.log('onResubmitApproval이 없음');
      }
    }
  }, [approval, isEditMode, editData, onResubmitApproval, currentUserId]);

  return {
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
  };
} 