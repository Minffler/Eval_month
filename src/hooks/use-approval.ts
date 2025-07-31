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
  
  // isEditMode 상태 변화 추적 로그 삭제
  React.useEffect(() => {
  }, [isEditMode]);
  const [editData, setEditData] = React.useState<any>(null);

  React.useEffect(() => {
    if (approval) {
      setRejectionReason(approval.rejectionReason || '');
      setEditData(approval.payload.data);
      // approval 변경, editData 설정 로그 삭제
    }
  }, [approval]);

  const actions = React.useMemo(() => {
    if (!approval) return null;
    const actions = getApprovalActions(approval, userRole, currentUserId);
    // 결재 액션 권한 확인 로그 삭제
    return actions;
  }, [approval, userRole, currentUserId, onResubmitApproval]);

  const handleApprovalDecision = React.useCallback(async (decision: 'approved' | 'rejected') => {
    if (!approval) return;

    // 결재 처리 시작 로그 삭제

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
        // admin 결재 처리 로그 삭제
        
        // approverHRId, approverTeamId 수정 로그 삭제
        if (approval.approverHRId === '1911042') {
          updatedApproval.approverHRId = 'admin';
        }
        if (approval.approverTeamId === '1911042') {
          updatedApproval.approverTeamId = 'admin';
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
        
        // admin 결재 조건 확인 로그 삭제
        if (isAdminApprover) {
          // admin이 2차 결재자인 경우 (일반적인 2차 결재자 처리)
          // admin 2차 결재 처리 시작/완료 로그 삭제
        } else {
          // admin이지만 승인 권한이 없음 로그 삭제
          return; // 승인 권한이 없으면 처리하지 않음
        }
        updatedApproval.rejectionReason = decision === 'rejected' ? rejectionReason : '';
      }

      // 결재 처리 결과/상태 변경/액션 호출 로그 삭제
      onApprovalAction(updatedApproval);
      
      // 성공 메시지 표시
      if (typeof window !== 'undefined') {
        const message = decision === 'approved' ? '결재가 승인되었습니다.' : '결재가 반려되었습니다.';
        alert(message);
      }
    } catch (error) {
      // 결재 처리 중 오류 로그 삭제
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

      // 1차 결재 생략 처리 로그 삭제
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

    // handleResubmit 호출 로그 삭제

    if (!isEditMode) {
      // 수정 모드로 전환
      // 수정 모드 전환/완료 로그 삭제
      setIsEditMode(true);
    } else {
      // 실제 재상신 처리
      // 재상신 처리 시작/데이터/액션 없음 로그 삭제
      if (onResubmitApproval) {
        const updatedApproval = {
          ...approval,
          payload: {
            ...approval.payload,
            data: editData
          }
        };
        onResubmitApproval(updatedApproval);
      } else {
        // 재상신 처리 시작/데이터/액션 없음 로그 삭제
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