import type { Approval, ApprovalStatus } from '@/lib/types';

/**
 * 결재 승인 권한 확인
 */
export const canApproveApproval = (
  approval: Approval,
  userRole: 'admin' | 'evaluator' | 'employee',
  currentUserId: string
): boolean => {
  if (!approval || !currentUserId) return false;

  // 1차 결재자 (현업) - 결재중 상태일 때만
  if (userRole === 'evaluator' && approval.approverTeamId === currentUserId) {
    return approval.status === '결재중';
  }

  // 2차 결재자 (인사) - 현업승인 후 결재중 상태일 때만
  if (userRole === 'admin' && (approval.approverHRId === currentUserId || approval.approverHRId === 'admin' || currentUserId === 'admin')) {
    return approval.status === '현업승인' && approval.statusHR === '결재중';
  }

  return false;
};

/**
 * 결재 삭제 권한 확인
 */
export const canDeleteApproval = (
  approval: Approval,
  userRole: 'admin' | 'evaluator' | 'employee',
  currentUserId: string
): boolean => {
  if (!approval || !currentUserId) return false;
  
  // 관리자는 모든 결재 삭제 가능
  if (userRole === 'admin') return true;
  
  // 평가자는 본인이 반려한 내역만 삭제 가능
  if (userRole === 'evaluator') {
    return approval.status === '반려' && approval.approverTeamId === currentUserId;
  }
  
  // 직원은 승인이 한건도 나지 않은 내역 또는 반려된 내역 삭제 가능
  if (userRole === 'employee') {
    return (approval.status === '결재중' && approval.statusHR === '결재중') || 
           (approval.status === '반려' || approval.statusHR === '반려');
  }
  
  return false;
};

/**
 * 결재 재상신 권한 확인
 */
export const canResubmitApproval = (
  approval: Approval,
  currentUserId: string
): boolean => {
  if (!approval || !currentUserId) return false;
  
  // 요청자만 재상신 가능
  return approval.requesterId === currentUserId && 
         (approval.status === '반려' || approval.statusHR === '반려');
};

/**
 * 1차 결재 생략 가능 여부 확인
 */
export const canSkipFirstApproval = (
  approval: Approval,
  userRole: 'admin' | 'evaluator' | 'employee',
  currentUserId: string
): boolean => {
  if (!approval || !currentUserId) return false;
  
  // 관리자가 1차 결재를 건너뛰고 바로 승인할 수 있는지 (2차 결재자만 가능)
  return userRole === 'admin' && 
         (approval.approverHRId === currentUserId || approval.approverHRId === 'admin' || currentUserId === 'admin') &&
         approval.status === '결재중' && 
         approval.statusHR === '결재중';
};

/**
 * 결재 상태에 따른 액션 버튼 표시 여부
 */
export const getApprovalActions = (
  approval: Approval,
  userRole: 'admin' | 'evaluator' | 'employee',
  currentUserId: string
) => {
  const canApprove = canApproveApproval(approval, userRole, currentUserId);
  const canDelete = canDeleteApproval(approval, userRole, currentUserId);
  const canResubmit = canResubmitApproval(approval, currentUserId);
  const canSkip = canSkipFirstApproval(approval, userRole, currentUserId);

  return {
    canApprove,
    canDelete,
    canResubmit,
    canSkip,
    showApprovalButtons: canApprove,
    showDeleteButton: canDelete,
    showResubmitButton: canResubmit,
    showSkipButton: canSkip,
  };
};

/**
 * 결재 상태 텍스트 가져오기
 */
export const getApprovalStatusText = (status: ApprovalStatus): string => {
  const statusMap: Record<ApprovalStatus, string> = {
    '결재중': '결재중',
    '현업승인': '현업승인',
    '최종승인': '최종승인',
    '반려': '반려',
  };
  return statusMap[status] || status;
};

/**
 * 결재 타입 텍스트 가져오기
 */
export const getApprovalTypeText = (dataType: string, action: string): string => {
  const typeText = dataType === 'shortenedWorkHours' ? '단축근로' : '일근태';
  const actionText = action === 'add' ? '추가' : action === 'edit' ? '수정' : '삭제';
  return `${typeText} ${actionText}`;
}; 