'use client';

import * as React from 'react';
import type { AppNotification } from '@/lib/types';
import { useAuth } from './auth-context';

const NOTIFICATIONS_STORAGE_KEY = 'pl_eval_notifications';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => void;
  markAllAsRead: () => void;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

// Helper to get all notifications from storage
const getAllNotifications = (): AppNotification[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error reading notifications from localStorage', error);
        return [];
    }
};

// Helper to save all notifications to storage
const saveAllNotifications = (notifications: AppNotification[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
        console.error('Error saving notifications to localStorage', error);
    }
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [allNotifications, setAllNotifications] = React.useState<AppNotification[]>([]);

    React.useEffect(() => {
        setAllNotifications(getAllNotifications());
    }, []);

    const notificationsForUser = React.useMemo(() => {
        if (!user) return [];
        return allNotifications
            .filter(n => n.recipientId === user.uniqueId || n.recipientId === 'all') // 'all' for system-wide notifications
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [user, allNotifications]);

    const unreadCount = React.useMemo(() => {
        return notificationsForUser.filter(n => !n.isRead).length;
    }, [notificationsForUser]);

    const addNotification = React.useCallback((notificationData: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => {
        const newNotification: AppNotification = {
            ...notificationData,
            id: `notif-${Date.now()}-${Math.random()}`,
            date: new Date().toISOString(),
            isRead: false,
        };

        setAllNotifications(prev => {
            const updated = [newNotification, ...prev];
            saveAllNotifications(updated);
            return updated;
        });
    }, []);

    const markAllAsRead = React.useCallback(() => {
        if (!user) return;
        
        setTimeout(() => {
            setAllNotifications(prev => {
                let changed = false;
                const updated = prev.map(n => {
                    if ((n.recipientId === user.uniqueId || n.recipientId === 'all') && !n.isRead) {
                        changed = true;
                        return { ...n, isRead: true };
                    }
                    return n;
                });
                if (changed) {
                    saveAllNotifications(updated);
                    return updated;
                }
                return prev;
            });
        }, 500); // Give a slight delay
    }, [user]);

    const value = {
        notifications: notificationsForUser,
        unreadCount,
        addNotification,
        markAllAsRead,
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
