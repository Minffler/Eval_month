'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Role } from '@/lib/types';
import { UserCog, UserCheck, User as UserIcon } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: Role;
  availableRoles: Role[];
  onRoleChange: (role: Role) => void;
}

export function RoleSwitcher({ currentRole, availableRoles, onRoleChange }: RoleSwitcherProps) {
  const allRoles: { value: Role; label: string; icon: React.ElementType }[] = [
    { value: 'admin', label: '관리자', icon: UserCog },
    { value: 'evaluator', label: '평가자', icon: UserCheck },
    { value: 'employee', label: '피평가자', icon: UserIcon },
  ];

  const rolesToShow = allRoles.filter(r => r.value && availableRoles.includes(r.value));

  const CurrentIcon = allRoles.find(r => r.value === currentRole)?.icon || UserIcon;

  return (
    <Select value={currentRole || 'none'} onValueChange={(value: Role) => onRoleChange(value === 'none' ? null : value)}>
      <SelectTrigger className="w-auto md:w-[180px] gap-2">
        <CurrentIcon className="h-4 w-4 text-muted-foreground" />
        <div className="hidden md:block">
            <SelectValue placeholder="역할 선택" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span>역할 선택</span>
          </div>
        </SelectItem>
        {rolesToShow.map(({ value, label, icon: Icon }) => (
          <SelectItem key={value} value={value!}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
