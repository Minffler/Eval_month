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
  markNotificationsAsRead: () => void;
  
  approvals: Approval[];
  unreadApprovalCount: number;
  addApproval: (approval: Omit<Approval, 'id' | 'date' | 'isRead' | 'status' | 'statusHR' | 'approvedAtTeam' | 'approvedAtHR' | 'rejectionReason'>) => void;
  updateApprovalStatus: (approvalId: string, step: 'team' | 'hr', status: 'approved' | 'rejected', reason?: string) => void;
  markApprovalsAsRead: () => void;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

const getAllItems = <T,>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return [];
    }
};

const saveAllItems = <T,>(key: string, items: T[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
        console.error(`Error saving ${key} to localStorage`, error);
    }
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [allNotifications, setAllNotifications] = React.useState<AppNotification[]>(() => getAllItems(NOTIFICATIONS_STORAGE_KEY));
    const [allApprovals, setAllApprovals] = React.useState<Approval[]>(() => getAllItems(APPROVALS_STORAGE_KEY));

    const addNotification = React.useCallback((notificationData: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => {
        setAllNotifications(prev => {
            const newNotification: AppNotification = {
                ...notificationData,
                id: `notif-${Date.now()}-${Math.random()}`,
                date: new Date().toISOString(),
                isRead: false,
            };
            const threeMonthsAgo = subMonths(new Date(), 3);
            const updated = [newNotification, ...prev].filter(n => new Date(n.date) >= threeMonthsAgo);
            saveAllItems(NOTIFICATIONS_STORAGE_KEY, updated);
            return updated;
        });
    }, []);
    
    const addApproval = React.useCallback((approvalData: Omit<Approval, 'id' | 'date' | 'isRead' | 'status' | 'statusHR' | 'approvedAtTeam' | 'approvedAtHR' | 'rejectionReason'>) => {
        setAllApprovals(prev => {
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
            const updated = [newApproval, ...prev];
            saveAllItems(APPROVALS_STORAGE_KEY, updated);
            return updated;
        });
    }, []);
    
    const updateApprovalStatus = React.useCallback((approvalId: string, step: 'team' | 'hr', status: 'approved' | 'rejected', reason: string = '') => {
        setAllApprovals(prev => {
            const updated = prev.map(a => {
                if (a.id === approvalId) {
                    const now = new Date().toISOString();
                    if (step === 'team') {
                        return { 
                            ...a, 
                            status: status === 'approved' ? '현업승인' : '반려',
                            approvedAtTeam: status === 'approved' ? now : null,
                            isRead: true, // Mark as read for current user
                            rejectionReason: status === 'rejected' ? reason : '',
                         };
                    }
                    if (step === 'hr') {
                         return { 
                            ...a, 
                            statusHR: status === 'approved' ? '최종승인' : '반려',
                            approvedAtHR: status === 'approved' ? now : null,
                            isRead: true, // Mark as read for current user
                            rejectionReason: status === 'rejected' ? reason : '',
                         };
                    }
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
                const updated = prev.map(n =>
                    (n.recipientId === user.uniqueId || n.recipientId === 'all') && !n.isRead
                        ? { ...n, isRead: true }
                        : n
                );
                saveAllItems(NOTIFICATIONS_STORAGE_KEY, updated);
                return updated;
            });
        }, 500);
    }, [user]);

    const markApprovalsAsRead = React.useCallback(() => {
        if (!user) return;
        setTimeout(() => {
            setAllApprovals(prev => {
                const isTeamApprover = prev.some(a => a.approverTeamId === user.uniqueId);
                const isHrApprover = prev.some(a => a.approverHRId === user.uniqueId);

                const updated = prev.map(a => {
                    let shouldMarkAsRead = false;
                    if (isTeamApprover && a.approverTeamId === user.uniqueId) shouldMarkAsRead = true;
                    if (isHrApprover && a.approverHRId === user.uniqueId) shouldMarkAsRead = true;

                    if (shouldMarkAsRead && !a.isRead) {
                        return { ...a, isRead: true };
                    }
                    return a;
                });
                saveAllItems(APPROVALS_STORAGE_KEY, updated);
                return updated;
            });
        }, 500);
    }, [user]);

    const notificationsForUser = React.useMemo(() => {
        if (!user) return [];
        return allNotifications
            .filter(n => n.recipientId === user.uniqueId || n.recipientId === 'all')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
            if (a.approverHRId === user.uniqueId && a.statusHR === '결재중' && !a.isRead) return true;
            return false;
        }).length;
    }, [user, approvalsForUser]);


    const value = {
        notifications: notificationsForUser,
        unreadNotificationCount,
        addNotification,
        markNotificationsAsRead,
        approvals: approvalsForUser,
        unreadApprovalCount,
        addApproval,
        updateApprovalStatus,
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
