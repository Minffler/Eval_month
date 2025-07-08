'use client';

import { useAuth } from '@/contexts/auth-context';
import { RoleSwitcher } from './role-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, LogOut } from 'lucide-react';

export default function Header() {
  const { user, role, setRole, logout } = useAuth();

  const roleDisplay: Record<string, string> = {
    admin: '관리자',
    evaluator: '평가자',
    employee: '피평가자',
  };

  if (!user || !role) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex-1">
        <h1 className="text-xl font-semibold font-headline">
          {roleDisplay[role]} 대시보드
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {user.roles.length > 1 && (
           <RoleSwitcher currentRole={role} availableRoles={user.roles} onRoleChange={setRole} />
        )}
        <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} alt={user?.name} data-ai-hint="person avatar" />
            <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left">
            <span className="font-semibold text-sm">{user?.name}</span>
            <span className="text-xs text-muted-foreground">{user?.title}</span>
          </div>
        </div>
        <Button variant="ghost" onClick={logout} size="icon" className="rounded-full" aria-label="로그아웃">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
