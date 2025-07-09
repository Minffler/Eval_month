'use client';

import { useAuth } from '@/contexts/auth-context';
import { RoleSwitcher } from './role-switcher';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { MonthSelector } from './month-selector';
import { useNotifications } from '@/contexts/notification-context';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface HeaderProps {
    selectedDate: { year: number, month: number };
    onDateChange: (date: { year: number, month: number }) => void;
}

export default function Header({ selectedDate, onDateChange }: HeaderProps) {
  const { user, role, setRole } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const roleDisplay: Record<string, string> = {
    admin: '관리자',
    evaluator: '평가자',
    employee: '피평가자',
  };

  if (!user || !role) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold font-headline flex-shrink-0">
                {roleDisplay[role]} 대시보드
            </h1>
            <MonthSelector selectedDate={selectedDate} onDateChange={onDateChange} />
        </div>
        
        <div className="flex items-center gap-2">
            {user.roles.length > 1 && (
               <RoleSwitcher currentRole={role} availableRoles={user.roles} onRoleChange={setRole} />
            )}
            
            <Popover onOpenChange={(open) => { if (open) markAllAsRead()}}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/80"></span>
                      </span>
                    )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="p-4">
                  <h3 className="font-semibold text-lg">알림</h3>
                </div>
                <Separator />
                <div className="p-2 max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <ul className="space-y-2">
                      {notifications.map((notification) => (
                        <li key={notification.id} className={cn("p-2 rounded-md", !notification.isRead && "bg-muted")}>
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(notification.date), "yyyy.MM.dd HH:mm", { locale: ko })}
                            </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground p-4">새로운 알림이 없습니다.</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
        </div>
    </div>
  );
}
