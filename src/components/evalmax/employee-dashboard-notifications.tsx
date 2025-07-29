'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, X } from "lucide-react";
import { cn, formatDateTime } from '@/lib/utils';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { AppNotification } from "@/lib/types";

interface EmployeeNotificationsProps {
    notifications: AppNotification[];
    deleteNotification: (notificationId: string) => void;
}

const formatTimestamp = (isoString: string | null) => {
  return formatDateTime(isoString || undefined);
};

export default function EmployeeNotifications({ notifications, deleteNotification }: EmployeeNotificationsProps) {
    return (
        <Card className="shadow-sm border-gray-200">
            <CardHeader className="p-4">
                <CardTitle>알림함</CardTitle>
                <CardDescription>최근 알림 내역입니다.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
                {notifications.length > 0 ? (
                    <ul className="space-y-4">
                    {notifications.map((notification) => (
                        <li key={notification.id} className={cn(
                            "group relative p-3 rounded-md border", 
                            !notification.isRead && "bg-gray-50",
                            notification.isImportant && "border-orange-300 bg-orange-50"
                        )}>
                            <div className="flex items-start gap-3">
                                {notification.isImportant && <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />}
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{notification.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatTimestamp(notification.date)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteNotification(notification.id)}
                            >
                                <X className="h-4 w-4 text-red-600" />
                            </Button>
                        </li>
                    ))}
                    </ul>
                ) : (
                   <div className="flex flex-col items-center justify-center h-40 text-center">
                        <Bell className="h-10 w-10 text-gray-400 mb-4" />
                        <p className="text-gray-500">새로운 알림이 없습니다.</p>
                   </div>
                )}
            </CardContent>
        </Card>
    );
}
