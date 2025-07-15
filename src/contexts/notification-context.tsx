'use client';

import * as React from 'react';
import type { AppNotification, Approval, ApprovalStatus } from '@/lib/types';
import { useAuth } from './auth-context';
import { subMonths } from 'date-fns';

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
  markApprovalsAsRead: () => void;
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
    const { user } = useAuth();
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
                    const updatedApproval = { ...a, ...approval, payload: { ...a.payload, ...approval.payload } };
                    if (approval.status === '현업승인' && a.status !== '현업승인') {
                        updatedApproval.approvedAtTeam = now;
                    }
                    if (approval.statusHR === '최종승인' && a.statusHR !== '최종승인') {
                        updatedApproval.approvedAtHR = now;
                    }
                    if (approval.statusHR === '반려' && a.statusHR !== '반려') {
                        updatedApproval.statusHR = '반려';
                    }
                    return updatedApproval;
                }
                return a;
            });
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
                    saveAllItems(APPROVALS_STORAGE_KEY, updated);
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
        markApprovalsAsRead,
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
