import { renderHook } from '@testing-library/react';
import { useNotificationFilters, useApprovalFilters, useDataIndexing } from '@/hooks/use-notification-utils';
import type { AppNotification, Approval } from '@/lib/types';

describe('Notification Utils Hooks', () => {
  describe('useNotificationFilters', () => {
    const mockNotifications: AppNotification[] = [
      {
        id: '1',
        title: '테스트 알림 1',
        message: '중요한 알림',
        date: '2024-01-15T10:00:00Z',
        isRead: false,
        isImportant: true,
        recipientId: 'user1'
      },
      {
        id: '2',
        title: '테스트 알림 2',
        message: '일반 알림',
        date: '2024-01-15T11:00:00Z',
        isRead: true,
        isImportant: false,
        recipientId: 'user1'
      },
      {
        id: '3',
        title: '전체 알림',
        message: '모든 사용자에게',
        date: '2024-01-15T12:00:00Z',
        isRead: false,
        isImportant: false,
        recipientId: 'all'
      }
    ];

    it('사용자별 알림을 올바르게 필터링한다', () => {
      const { result } = renderHook(() => 
        useNotificationFilters(mockNotifications, 'user1')
      );

      expect(result.current.userNotifications).toHaveLength(3); // user1 + all
      expect(result.current.unreadCount).toBe(2); // 읽지 않은 알림 2개
    });

    it('중요 알림이 우선 정렬된다', () => {
      const { result } = renderHook(() => 
        useNotificationFilters(mockNotifications, 'user1')
      );

      const sorted = result.current.sortedNotifications;
      expect(sorted[0].isImportant).toBe(true); // 첫 번째가 중요 알림
    });

    it('사용자가 없으면 빈 배열을 반환한다', () => {
      const { result } = renderHook(() => 
        useNotificationFilters(mockNotifications, null)
      );

      expect(result.current.userNotifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('useApprovalFilters', () => {
    const mockApprovals: Approval[] = [
      {
        id: '1',
        requesterId: 'user1',
        requesterName: '김철수',
        approverTeamId: 'evaluator1',
        approverHRId: 'admin',
        type: 'workDataChange',
        payload: {
          dataType: 'shortenedWorkHours',
          action: 'add',
          data: {}
        },
        date: '2024-01-15T10:00:00Z',
        isRead: false,
        status: '결재중',
        statusHR: '결재중'
      },
      {
        id: '2',
        requesterId: 'user2',
        requesterName: '이영희',
        approverTeamId: 'evaluator1',
        approverHRId: 'admin',
        type: 'workDataChange',
        payload: {
          dataType: 'dailyAttendance',
          action: 'edit',
          data: {}
        },
        date: '2024-01-15T11:00:00Z',
        isRead: true,
        status: '현업승인',
        statusHR: '결재중'
      }
    ];

    it('관리자는 모든 결재를 볼 수 있다', () => {
      const { result } = renderHook(() => 
        useApprovalFilters(mockApprovals, 'admin', ['admin'])
      );

      expect(result.current.userApprovals).toHaveLength(2);
    });

    it('현업 결재자는 자신의 결재만 볼 수 있다', () => {
      const { result } = renderHook(() => 
        useApprovalFilters(mockApprovals, 'evaluator1', ['evaluator'])
      );

      expect(result.current.userApprovals).toHaveLength(2);
    });

    it('요청자는 자신이 요청한 결재만 볼 수 있다', () => {
      const { result } = renderHook(() => 
        useApprovalFilters(mockApprovals, 'user1', ['employee'])
      );

      expect(result.current.userApprovals).toHaveLength(1);
      expect(result.current.userApprovals[0].requesterId).toBe('user1');
    });

    it('읽지 않은 결재 개수를 올바르게 계산한다', () => {
      const { result } = renderHook(() => 
        useApprovalFilters(mockApprovals, 'evaluator1', ['evaluator'])
      );

      expect(result.current.unreadCount).toBe(1); // 결재중인 것만
    });
  });

  describe('useDataIndexing', () => {
    const mockData = [
      { id: '1', recipientId: 'user1', name: '알림1' },
      { id: '2', recipientId: 'user1', name: '알림2' },
      { id: '3', recipientId: 'user2', name: '알림3' }
    ];

    it('데이터를 올바르게 인덱싱한다', () => {
      const { result } = renderHook(() => useDataIndexing(mockData));

      expect(result.current.indexedData.get('user1')).toHaveLength(2);
      expect(result.current.indexedData.get('user2')).toHaveLength(1);
    });

    it('키로 데이터를 조회할 수 있다', () => {
      const { result } = renderHook(() => useDataIndexing(mockData));

      const user1Data = result.current.getByKey('user1');
      expect(user1Data).toHaveLength(2);
      expect(user1Data[0].name).toBe('알림1');
    });

    it('존재하지 않는 키는 빈 배열을 반환한다', () => {
      const { result } = renderHook(() => useDataIndexing(mockData));

      const emptyData = result.current.getByKey('nonexistent');
      expect(emptyData).toHaveLength(0);
    });
  });
}); 