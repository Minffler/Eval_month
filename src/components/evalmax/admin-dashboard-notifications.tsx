'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { AppNotification } from "@/lib/types";

interface AdminNotificationsProps {
    notifications: AppNotification[];
}

export default function AdminNotifications({ notifications }: AdminNotificationsProps) {
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
                        <li key={notification.id} className={cn("p-3 rounded-md border", !notification.isRead && "bg-muted/50")}>
                            <p className="text-sm font-medium">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(notification.date), "yyyy.MM.dd HH:mm", { locale: ko })}
                            </p>
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
