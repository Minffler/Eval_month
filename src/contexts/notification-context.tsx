'use client';

import * as React from 'react';
import type { AppNotification, Approval } from '@/lib/types';
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
  addApproval: (approval: Omit<Approval, 'id' | 'date' | 'isRead' | 'status'>) => void;
  updateApprovalStatus: (approvalId: string, status: 'approved' | 'rejected') => void;
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
        const newNotification: AppNotification = {
            ...notificationData,
            id: `notif-${Date.now()}-${Math.random()}`,
            date: new Date().toISOString(),
            isRead: false,
        };
        const threeMonthsAgo = subMonths(new Date(), 3);
        setAllNotifications(prev => {
            const updated = [newNotification, ...prev].filter(n => new Date(n.date) >= threeMonthsAgo);
            saveAllItems(NOTIFICATIONS_STORAGE_KEY, updated);
            return updated;
        });
    }, []);
    
    const addApproval = React.useCallback((approvalData: Omit<Approval, 'id' | 'date' | 'isRead' | 'status'>) => {
        const newApproval: Approval = {
            ...approvalData,
            id: `appr-${Date.now()}-${Math.random()}`,
            date: new Date().toISOString(),
            isRead: false,
            status: 'pending',
        };
        setAllApprovals(prev => {
            const updated = [newApproval, ...prev];
            saveAllItems(APPROVALS_STORAGE_KEY, updated);
            return updated;
        });
    }, []);
    
    const updateApprovalStatus = React.useCallback((approvalId: string, status: 'approved' | 'rejected') => {
        setAllApprovals(prev => {
            const updated = prev.map(a => a.id === approvalId ? { ...a, status, isRead: true } : a);
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
                const updated = prev.map(a =>
                    a.approverId === user.uniqueId && !a.isRead
                        ? { ...a, isRead: true }
                        : a
                );
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
        return allApprovals
            .filter(a => a.approverId === user.uniqueId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [user, allApprovals]);

    const unreadNotificationCount = React.useMemo(() => {
        return notificationsForUser.filter(n => !n.isRead).length;
    }, [notificationsForUser]);
    
    const unreadApprovalCount = React.useMemo(() => {
        return approvalsForUser.filter(a => !a.isRead).length;
    }, [approvalsForUser]);

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
