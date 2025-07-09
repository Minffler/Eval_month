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

export default function Header() {
  const { user, role, setRole } = useAuth();

  const roleDisplay: Record<string, string> = {
    admin: '관리자',
    evaluator: '평가자',
    employee: '피평가자',
  };

  const notifications = [
    { date: '2025.07.07 14:00', message: '2025년 6월 평가대상자가 업로드 되었습니다. 평가를 진행해주세요.' },
    { date: '2025.07.15 09:00', message: '평가마감 기한이 3일 남았습니다. 근무율을 최종적으로 확인해주세요.' },
    { date: '2025.07.18 18:00', message: '평가가 마감되었습니다. 마감 이후 수정은 불가합니다.' },
  ];

  if (!user || !role) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold font-headline flex-1">
          {roleDisplay[role]} 대시보드
        </h1>
        {user.roles.length > 1 && (
           <RoleSwitcher currentRole={role} availableRoles={user.roles} onRoleChange={setRole} />
        )}
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
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
            <div className="p-2">
              {notifications.length > 0 ? (
                <ul className="space-y-2">
                  {notifications.map((notification, index) => (
                    <li key={index} className="p-2 rounded-md hover:bg-muted">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.date}</p>
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
  );
}
