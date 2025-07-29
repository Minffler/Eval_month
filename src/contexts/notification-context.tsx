'use client';

import * as React from 'react';
import type { AppNotification, Approval, ApprovalStatus } from '@/lib/types';
import { useAuth } from './auth-context';
import { useEvaluation } from './evaluation-context';
import { subMonths } from 'date-fns';
import { useDebouncedEffect } from '@/hooks/use-debounced-effect';

const NOTIFICATIONS_STORAGE_KEY = 'pl_eval_notifications';
const APPROVALS_STORAGE_KEY = 'pl_eval_approvals';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadNotificationCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => void;
  deleteNotification: (notificationId: string) => void;
  markNotificationsAsRead: () => void;
  
  approvals: Approval[];
  unreadApprovalCount: number;
  addApproval: (approval: Omit<Approval, 'id' | 'date' | 'isRead' | 'status' | 'statusHR' | 'approvedAtTeam' | 'approvedAtHR' | 'rejectionReason'>) => void;
  handleApprovalAction: (approval: Approval) => void;
  deleteApproval: (approvalId: string) => void;
  resubmitApproval: (approval: Approval) => void;
  markApprovalsAsRead: () => void;
  
  // 서버 연동 함수들 (향후 구현)
  syncWithServer: () => Promise<void>;
  sendToServer: (notification: AppNotification) => Promise<void>;
  realtimeNotifications: AppNotification[];
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

// Helper to remove duplicates from an array of objects based on a key
const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        const duplicate = seen.has(item.id);
        seen.add(item.id);
        return !duplicate;
    });
};

const getAllItems = <T extends { id: string }>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(key);
        if (key === APPROVALS_STORAGE_KEY) {
            // 기존 결재 데이터에서 잘못된 ID를 가진 항목들 필터링
            const items = stored ? JSON.parse(stored) : [];
            const invalidIds = ['1911042', '0000000', '9999999']; // 잘못된 ID 목록
            const filteredItems = items.filter((item: any) => {
                const hasInvalidId = invalidIds.some(invalidId => 
                    item.approverHRId === invalidId || 
                    item.approverTeamId === invalidId ||
                    item.requesterId === invalidId
                );
                if (hasInvalidId) {
                    console.log('잘못된 ID를 가진 결재 데이터 삭제:', item);
                    return false;
                }
                return true;
            });
            if (items.length !== filteredItems.length) {
                console.log(`${items.length - filteredItems.length}개의 잘못된 결재 데이터 삭제됨`);
                saveAllItems(APPROVALS_STORAGE_KEY, filteredItems);
            }
            return uniqueById(filteredItems);
        }
        const items = stored ? JSON.parse(stored) : [];
        return uniqueById(items); // Ensure data from storage is unique
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return [];
    }
};

const saveAllItems = <T extends { id: string }>(key: string, items: T[]) => {
    if (typeof window === 'undefined') return;
    try {
        // Ensure we are saving a unique list
        localStorage.setItem(key, JSON.stringify(uniqueById(items)));
    } catch (error) {
        console.error(`Error saving ${key} to localStorage`, error);
    }
};


export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, userMap } = useAuth();
    const [allNotifications, setAllNotifications] = React.useState<AppNotification[]>(() => getAllItems<AppNotification>(NOTIFICATIONS_STORAGE_KEY));
    const [allApprovals, setAllApprovals] = React.useState<Approval[]>(() => getAllItems<Approval>(APPROVALS_STORAGE_KEY));

    React.useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === NOTIFICATIONS_STORAGE_KEY && event.newValue) {
                try {
                    const newItems = JSON.parse(event.newValue);
                    setAllNotifications(uniqueById(newItems));
                } catch (e) {
                    console.error('Error parsing notifications from storage event', e);
                }
            }
            if (event.key === APPROVALS_STORAGE_KEY && event.newValue) {
                 try {
                    const newItems = JSON.parse(event.newValue);
                    setAllApprovals(uniqueById(newItems));
                } catch (e) {
                    console.error('Error parsing approvals from storage event', e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const addNotification = React.useCallback((notificationData: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => {
        const newNotification: AppNotification = {
            ...notificationData,
            id: `notif-${Date.now()}-${Math.random()}`,
            date: new Date().toISOString(),
            isRead: false,
        };
        const threeMonthsAgo = subMonths(new Date(), 3);
        
        setAllNotifications(prev => {
            const updated = [newNotification, ...prev].filter(n => new Date(n.date) >= threeMonthsAgo);
            const uniqueUpdated = uniqueById(updated);
            saveAllItems(NOTIFICATIONS_STORAGE_KEY, uniqueUpdated);
            return uniqueUpdated;
        });
    }, []);

    const deleteNotification = React.useCallback((notificationId: string) => {
        setAllNotifications(prev => {
            const updated = prev.filter(n => n.id !== notificationId);
            saveAllItems(NOTIFICATIONS_STORAGE_KEY, updated);
            return updated;
        });
    }, []);
    
    const addApproval = React.useCallback((approvalData: Omit<Approval, 'id' | 'date' | 'isRead' | 'status' | 'statusHR' | 'approvedAtTeam' | 'approvedAtHR' | 'rejectionReason'>) => {
        const newApproval: Approval = {
            ...approvalData,
            id: `appr-${Date.now()}-${Math.random()}`,
            date: new Date().toISOString(),
            isRead: false,
            status: '결재중',
            statusHR: '결재중',
            approvedAtTeam: null,
            approvedAtHR: null,
            rejectionReason: '',
        };
        
        setAllApprovals(prev => {
            const updated = [newApproval, ...prev];
            const uniqueUpdated = uniqueById(updated);
            saveAllItems(APPROVALS_STORAGE_KEY, uniqueUpdated);
            return uniqueUpdated;
        });
    }, []);
    
        const handleApprovalAction = React.useCallback((approval: Approval) => {
        console.log('handleApprovalAction 호출됨:', approval);
        console.log('현재 allApprovals 상태:', allApprovals);
        
        // 결재 승인 시 근무 데이터 업데이트를 위한 이벤트 발생
        const triggerWorkRateUpdate = (approvedApproval: Approval) => {
            if (approvedApproval.statusHR === '최종승인') {
                const { payload } = approvedApproval;
                const { dataType, action, data } = payload;
                
                console.log('근무 데이터 업데이트 이벤트 발생:', { dataType, action, data });
                
                // 커스텀 이벤트를 통해 근무 데이터 업데이트 요청
                const event = new CustomEvent('workRateDataUpdate', {
                    detail: {
                        approval: approvedApproval,
                        payload,
                        dataType,
                        action,
                        data
                    }
                });
                window.dispatchEvent(event);
            }
        };
        
        setAllApprovals(prev => {
            const now = new Date().toISOString();

            // For resubmissions, we replace the existing approval with the new one.
            const isResubmission = approval.status === '결재중' && (prev.find(a => a.id === approval.id)?.status === '반려' || prev.find(a => a.id === approval.id)?.statusHR === '반려');

            if (isResubmission) {
                const updated = prev.map(a => a.id === approval.id ? approval : a);
                saveAllItems(APPROVALS_STORAGE_KEY, updated);
                return updated;
            }

            // For normal status updates
            const updated = prev.map(a => {
                if (a.id === approval.id) {
                    // 전달받은 approval 객체의 모든 값을 우선 사용
                    const updatedApproval = { 
                        ...a, 
                        ...approval, 
                        payload: { ...a.payload, ...approval.payload } 
                    };
                    
                    console.log('결재 업데이트:', {
                        before: { status: a.status, statusHR: a.statusHR, approvedAtTeam: a.approvedAtTeam, approvedAtHR: a.approvedAtHR },
                        after: { status: updatedApproval.status, statusHR: updatedApproval.statusHR, approvedAtTeam: updatedApproval.approvedAtTeam, approvedAtHR: updatedApproval.approvedAtHR }
                    });
                    
                    // 상태 변경 확인
                    if (a.statusHR !== updatedApproval.statusHR) {
                        console.log('statusHR 변경됨:', a.statusHR, '→', updatedApproval.statusHR);
                    }
                    if (a.approvedAtHR !== updatedApproval.approvedAtHR) {
                        console.log('approvedAtHR 변경됨:', a.approvedAtHR, '→', updatedApproval.approvedAtHR);
                    }
                    
                    // 결재 승인 시 근무 데이터 업데이트 이벤트 발생
                    triggerWorkRateUpdate(updatedApproval);
                    
                    return updatedApproval;
                }
                return a;
            });
            
            console.log('전체 결재 목록 업데이트 전후 비교:', {
                beforeCount: prev.length,
                afterCount: updated.length,
                changedApproval: updated.find(a => a.id === approval.id)
            });
            
            console.log('전체 결재 목록 업데이트 후:', updated);
            saveAllItems(APPROVALS_STORAGE_KEY, updated);
            
            // 강제 리렌더링을 위한 즉시 실행
            console.log('즉시 UI 업데이트 실행');
            console.log('업데이트된 결재 데이터:', updated);
            // 새로운 배열로 강제 리렌더링
            setAllApprovals([...updated]);
            
            // 추가로 한 번 더 강제 업데이트
            setTimeout(() => {
                console.log('추가 UI 업데이트 실행');
                setAllApprovals(current => [...current]);
            }, 10);
            
            // 최종 확인을 위한 강제 리렌더링
            setTimeout(() => {
                console.log('최종 UI 업데이트 실행');
                const finalApprovals = getAllItems<Approval>(APPROVALS_STORAGE_KEY);
                console.log('최종 결재 데이터:', finalApprovals);
                setAllApprovals(finalApprovals);
                
                // 브라우저 콘솔에서 직접 확인할 수 있도록
                console.log('=== UI 업데이트 완료 ===');
                console.log('localStorage 데이터:', localStorage.getItem(APPROVALS_STORAGE_KEY));
                console.log('현재 상태:', allApprovals);
            }, 100);
            
            return updated;
        });
    }, [allApprovals]);

    const deleteApproval = React.useCallback((approvalId: string) => {
        setAllApprovals(prev => {
            const updated = prev.filter(a => a.id !== approvalId);
            saveAllItems(APPROVALS_STORAGE_KEY, updated);
            return updated;
        });
    }, []);

    const resubmitApproval = React.useCallback((approval: Approval) => {
        // 기존 결재를 삭제하고 새로운 결재로 재상신
        setAllApprovals(prev => {
            const filtered = prev.filter(a => a.id !== approval.id);
            const newApproval: Approval = {
                ...approval,
                id: `appr-${Date.now()}-${Math.random()}`,
                date: new Date().toISOString(),
                status: '결재중',
                statusHR: '결재중',
                approvedAtTeam: null,
                approvedAtHR: null,
                rejectionReason: '',
                isRead: false,
            };
            const updated = [newApproval, ...filtered];
            saveAllItems(APPROVALS_STORAGE_KEY, updated);
            return updated;
        });
    }, []);

    const markNotificationsAsRead = React.useCallback(() => {
        if (!user) return;
        setTimeout(() => {
            setAllNotifications(prev => {
                let hasChanged = false;
                const updated = prev.map(n => {
                    if ((n.recipientId === user.uniqueId || n.recipientId === 'all') && !n.isRead) {
                        hasChanged = true;
                        return { ...n, isRead: true };
                    }
                    return n;
                });
                
                if (hasChanged) {
                    saveAllItems(NOTIFICATIONS_STORAGE_KEY, updated);
                }
                return updated;
            });
        }, 500);
    }, [user]);

    const markApprovalsAsRead = React.useCallback(() => {
        if (!user) return;
        setTimeout(() => {
            setAllApprovals(prev => {
                let hasChanged = false;
                const updated = prev.map(a => {
                    let shouldMarkAsRead = false;
                    // 현업 결재자가 자신의 턴일 때
                    if (a.approverTeamId === user.uniqueId && a.status === '결재중') shouldMarkAsRead = true;
                    // 인사부 결재자가 자신의 턴일 때 (현업 승인 후)
                    if (a.approverHRId === user.uniqueId && a.status === '현업승인' && a.statusHR === '결재중') shouldMarkAsRead = true;
                    // 요청자가 반려 상태를 확인할 때
                    if (a.requesterId === user.uniqueId && (a.status === '반려' || a.statusHR === '반려')) shouldMarkAsRead = true;


                    if (shouldMarkAsRead && !a.isRead) {
                        hasChanged = true;
                        return { ...a, isRead: true };
                    }
                    return a;
                });
                
                if (hasChanged) {
                    const uniqueUpdated = uniqueById(updated);
                    saveAllItems(APPROVALS_STORAGE_KEY, uniqueUpdated);
                }
                return updated;
            });
        }, 500);
    }, [user]);

    const notificationsForUser = React.useMemo(() => {
        if (!user) return [];
        return allNotifications
            .filter(n => n.recipientId === user.uniqueId || n.recipientId === 'all')
            .sort((a, b) => {
                // Important notifications first
                if (a.isImportant && !b.isImportant) return -1;
                if (!a.isImportant && b.isImportant) return 1;
                // Then by date descending
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [user, allNotifications]);
    
    const approvalsForUser = React.useMemo(() => {
        if (!user) return [];
        // Admin sees all, Evaluator sees ones where they are the team approver, Employee sees their own.
        return allApprovals
            .filter(a => user.roles.includes('admin') || a.approverTeamId === user.uniqueId || a.requesterId === user.uniqueId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [user, allApprovals]);

    const unreadNotificationCount = React.useMemo(() => {
        return notificationsForUser.filter(n => !n.isRead).length;
    }, [notificationsForUser]);
    
    const unreadApprovalCount = React.useMemo(() => {
        if (!user) return 0;
        return approvalsForUser.filter(a => {
            if (a.approverTeamId === user.uniqueId && a.status === '결재중' && !a.isRead) return true;
            if (a.approverHRId === user.uniqueId && a.status === '현업승인' && a.statusHR === '결재중' && !a.isRead) return true;
            if (a.requesterId === user.uniqueId && (a.status === '반려' || a.statusHR === '반려') && !a.isRead) return true;
            return false;
        }).length;
    }, [user, approvalsForUser]);

    // 성능 최적화: 알림 데이터 인덱싱
    const notificationIndex = React.useMemo(() => {
      const index = new Map<string, AppNotification[]>();
      allNotifications.forEach(notification => {
        const key = notification.recipientId || 'all';
        if (!index.has(key)) index.set(key, []);
        index.get(key)!.push(notification);
      });
      return index;
    }, [allNotifications]);

    // 성능 최적화: 결재 데이터 인덱싱
    const approvalIndex = React.useMemo(() => {
      const index = new Map<string, Approval[]>();
      allApprovals.forEach(approval => {
        // 요청자별 인덱스
        if (!index.has(`requester_${approval.requesterId}`)) {
          index.set(`requester_${approval.requesterId}`, []);
        }
        index.get(`requester_${approval.requesterId}`)!.push(approval);
        
        // 현업 결재자별 인덱스
        if (!index.has(`team_${approval.approverTeamId}`)) {
          index.set(`team_${approval.approverTeamId}`, []);
        }
        index.get(`team_${approval.approverTeamId}`)!.push(approval);
        
        // 인사부 결재자별 인덱스
        if (!index.has(`hr_${approval.approverHRId}`)) {
          index.set(`hr_${approval.approverHRId}`, []);
        }
        index.get(`hr_${approval.approverHRId}`)!.push(approval);
      });
      return index;
    }, [allApprovals]);

      // 디바운스된 저장 함수
  const debouncedSaveNotifications = React.useCallback((notifications: AppNotification[]) => {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      saveAllItems(NOTIFICATIONS_STORAGE_KEY, notifications);
    }, 1000);
  }, []);

  const debouncedSaveApprovals = React.useCallback((approvals: Approval[]) => {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      saveAllItems(APPROVALS_STORAGE_KEY, approvals);
    }, 1000);
  }, []);


    // 서버 연동 함수들 (향후 구현)
    const syncWithServer = React.useCallback(async () => {
        try {
            // TODO: 서버와 동기화 로직 구현
            console.log('서버 동기화 기능은 향후 구현 예정');
        } catch (error) {
            console.error('서버 동기화 실패:', error);
        }
    }, []);

    const sendToServer = React.useCallback(async (notification: AppNotification) => {
        try {
            // TODO: 서버로 알림 전송 로직 구현
            console.log('서버 전송 기능은 향후 구현 예정');
        } catch (error) {
            console.error('서버 전송 실패:', error);
        }
    }, []);

    const realtimeNotifications: AppNotification[] = []; // TODO: WebSocket/SSE로 실시간 알림 구현

    const value = {
        notifications: notificationsForUser,
        unreadNotificationCount,
        addNotification,
        deleteNotification,
        markNotificationsAsRead,
        approvals: approvalsForUser,
        unreadApprovalCount,
        addApproval,
        handleApprovalAction,
        deleteApproval,
        resubmitApproval,
        markApprovalsAsRead,
        syncWithServer,
        sendToServer,
        realtimeNotifications,
    };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
    const context = React.useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
