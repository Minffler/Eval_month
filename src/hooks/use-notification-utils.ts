import { useCallback, useMemo } from 'react';
import type { AppNotification, Approval } from '@/lib/types';

/**
 * 알림 데이터 필터링 및 정렬을 위한 커스텀 훅
 */
export const useNotificationFilters = (
  notifications: AppNotification[],
  userId: string | null
) => {
  // 사용자별 알림 필터링
  const userNotifications = useMemo(() => {
    if (!userId) return [];
    return notifications.filter(n => 
      n.recipientId === userId || n.recipientId === 'all'
    );
  }, [notifications, userId]);

  // 읽지 않은 알림 개수
  const unreadCount = useMemo(() => 
    userNotifications.filter(n => !n.isRead).length,
    [userNotifications]
  );

  // 중요 알림 우선 정렬
  const sortedNotifications = useMemo(() => 
    userNotifications.sort((a, b) => {
      // 중요 알림 우선
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      // 날짜 내림차순
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }),
    [userNotifications]
  );

  return {
    userNotifications,
    unreadCount,
    sortedNotifications
  };
};

/**
 * 결재 데이터 필터링 및 정렬을 위한 커스텀 훅
 */
export const useApprovalFilters = (
  approvals: Approval[],
  userId: string | null,
  userRoles: string[]
) => {
  // 사용자 권한에 따른 결재 필터링
  const userApprovals = useMemo(() => {
    if (!userId) return [];
    
    return approvals.filter(approval => {
      // 관리자는 모든 결재 조회 가능
      if (userRoles.includes('admin')) return true;
      // 현업 결재자는 자신이 결재자인 경우
      if (approval.approverTeamId === userId) return true;
      // 요청자는 자신이 요청한 결재
      if (approval.requesterId === userId) return true;
      return false;
    });
  }, [approvals, userId, userRoles]);

  // 읽지 않은 결재 개수
  const unreadCount = useMemo(() => {
    if (!userId) return 0;
    
    return userApprovals.filter(approval => {
      // 현업 결재자가 자신의 턴일 때
      if (approval.approverTeamId === userId && approval.status === '결재중' && !approval.isRead) return true;
      // 인사부 결재자가 자신의 턴일 때
      if (approval.approverHRId === userId && approval.status === '현업승인' && approval.statusHR === '결재중' && !approval.isRead) return true;
      // 요청자가 반려 상태를 확인할 때
      if (approval.requesterId === userId && (approval.status === '반려' || approval.statusHR === '반려') && !approval.isRead) return true;
      return false;
    }).length;
  }, [userApprovals, userId]);

  // 날짜 내림차순 정렬
  const sortedApprovals = useMemo(() => 
    userApprovals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [userApprovals]
  );

  return {
    userApprovals,
    unreadCount,
    sortedApprovals
  };
};

/**
 * 데이터 인덱싱을 위한 커스텀 훅
 */
export const useDataIndexing = <T extends { id: string }>(data: T[]) => {
  const indexedData = useMemo(() => {
    const index = new Map<string, T[]>();
    data.forEach(item => {
      const key = (item as any).recipientId || (item as any).requesterId || item.id;
      if (!index.has(key)) index.set(key, []);
      index.get(key)!.push(item);
    });
    return index;
  }, [data]);

  const getByKey = useCallback((key: string) => {
    return indexedData.get(key) || [];
  }, [indexedData]);

  return {
    indexedData,
    getByKey
  };
}; 