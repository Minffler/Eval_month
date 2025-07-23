'use client';

import { RoleSwitcher } from './role-switcher';
import { Button } from '@/components/ui/button';
import { Bell, Inbox } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatDateTime } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AppNotification, Approval, User, Role } from '@/lib/types';

interface HeaderProps {
    user: User | null;
    userMap: Map<string, User>;
    role: Role;
    setRole: (role: Role) => void;
    selectedDate: { year: number, month: number };
    onDateChange: (date: { year: number, month: number }) => void;
    notifications: AppNotification[];
    unreadNotificationCount: number;
    markNotificationsAsRead: () => void;
    approvals: Approval[];
    unreadApprovalCount: number;
    markApprovalsAsRead: () => void;
    setActiveView: (view: string) => void;
}

const formatTimestamp = (isoString: string | null) => {
  return formatDateTime(isoString || undefined);
};

export default function Header({ 
  user,
  userMap,
  role,
  setRole,
  selectedDate, 
  onDateChange,
  notifications,
  unreadNotificationCount,
  markNotificationsAsRead,
  approvals,
  unreadApprovalCount,
  markApprovalsAsRead,
  setActiveView
}: HeaderProps) {
  const roleDisplay: Record<string, string> = {
    admin: '관리자',
    evaluator: '평가자',
    employee: '피평가자',
  };

  if (!user || !role) {
    return null;
  }
  
  const currentUser = userMap.get(user.uniqueId);

  const currentClientYear = new Date().getFullYear();
  const availableYears = Array.from({ length: Math.max(0, currentClientYear - 2025 + 1) }, (_, i) => 2025 + i).reverse();
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearChange = (yearStr: string) => {
    const newYear = parseInt(yearStr, 10);
    onDateChange({ year: newYear, month: selectedDate.month });
  };
  
  const handleMonthChange = (monthStr: string) => {
    const newMonth = parseInt(monthStr, 10);
    onDateChange({ year: selectedDate.year, month: newMonth });
  };

  const getValidMonthsForYear = (year: number) => {
    const today = new Date();
    // A month is available only after it has completely passed.
    // e.g., July's evaluation data is available from August 1st.
    if (year < today.getFullYear()) {
      return allMonths; // Past years have all months available
    }
    if (year > today.getFullYear()) {
      return []; // Future years have no months available
    }
    // For the current year, only months fully passed are available.
    return allMonths.filter(m => m < today.getMonth() + 1);
  };
  
  const monthsForSelectedYear = getValidMonthsForYear(selectedDate.year);


  return (
    <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold font-headline flex-shrink-0">
                {roleDisplay[role]} 대시보드
            </h1>
            <div className="flex items-center gap-2">
                 <Select value={String(selectedDate.year)} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-auto min-w-[110px]">
                        <SelectValue placeholder="연도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map(year => (
                        <SelectItem key={year} value={String(year)}>
                            {year}년
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={String(selectedDate.month)} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-auto min-w-[90px]">
                        <SelectValue placeholder="월 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">전체 월</SelectItem>
                        {monthsForSelectedYear.map(month => (
                        <SelectItem key={month} value={String(month)}>
                            {month}월
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            {(currentUser?.roles?.length ?? 0) > 1 && (
               <RoleSwitcher currentRole={role} availableRoles={currentUser?.roles || []} onRoleChange={setRole} />
            )}
            
            <Popover onOpenChange={(open) => { if (open) markApprovalsAsRead()}}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Inbox className="h-5 w-5" />
                    {unreadApprovalCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/80"></span>
                      </span>
                    )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="p-4">
                  <h3 className="font-semibold text-lg">결재함</h3>
                </div>
                <Separator />
                <div className="p-2 max-h-96 overflow-y-auto">
                  {approvals.length > 0 ? (
                    <ul className="space-y-2">
                      {approvals.map((approval) => (
                        <li key={approval.id} className={cn("p-2 rounded-md hover:bg-muted cursor-pointer", !approval.isRead && "bg-muted")} onClick={() => setActiveView('approvals')}>
                            <p className="text-sm">{approval.requesterName}님의 결재 요청</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(approval.date)}
                            </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground p-4">새로운 결재내역이 없습니다.</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Popover onOpenChange={(open) => { if (open) markNotificationsAsRead()}}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
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
                   <p className="text-xs text-muted-foreground">최근 3개월 동안의 알림만 표시됩니다.</p>
                </div>
                <Separator />
                <div className="p-2 max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <ul className="space-y-2">
                      {notifications.map((notification) => (
                        <li key={notification.id} className={cn("p-2 rounded-md", !notification.isRead && "bg-muted")}>
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(notification.date)}
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
