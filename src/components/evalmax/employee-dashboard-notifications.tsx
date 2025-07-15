'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { AppNotification } from "@/lib/types";

interface EmployeeNotificationsProps {
    notifications: AppNotification[];
    deleteNotification: (notificationId: string) => void;
}

const formatTimestamp = (isoString: string | null) => {
    if (!isoString) return '-';
    return format(new Date(isoString), 'yyyy.MM.dd HH:mm');
};

export default function EmployeeNotifications({ notifications, deleteNotification }: EmployeeNotificationsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>알림함</CardTitle>
                <CardDescription>최근 알림 내역입니다.</CardDescription>
            </CardHeader>
            <CardContent>
                {notifications.length > 0 ? (
                    <ul className="space-y-4">
                    {notifications.map((notification) => (
                        <li key={notification.id} className={cn(
                            "group relative p-3 rounded-md border", 
                            !notification.isRead && "bg-muted/50",
                            notification.isImportant && "border-primary/50 bg-primary/5"
                        )}>
                            <div className="flex items-start gap-3">
                                {notification.isImportant && <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />}
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatTimestamp(notification.date)}
                                    </p>
                                </div>
                            </div>
                            {!notification.isImportant && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteNotification(notification.id)}
                                >
                                    <X className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </li>
                    ))}
                    </ul>
                ) : (
                   <div className="flex flex-col items-center justify-center h-40 text-center">
                        <Bell className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">새로운 알림이 없습니다.</p>
                   </div>
                )}
            </CardContent>
        </Card>
    );
}
