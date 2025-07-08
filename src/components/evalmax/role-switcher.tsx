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
  onRoleChange: (role: Role) => void;
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const roles: { value: Role; label: string; icon: React.ElementType }[] = [
    { value: 'admin', label: 'Admin', icon: UserCog },
    { value: 'evaluator', label: 'Evaluator', icon: UserCheck },
    { value: 'employee', label: 'Employee', icon: UserIcon },
  ];

  const CurrentIcon = roles.find(r => r.value === currentRole)?.icon || UserIcon;

  return (
    <Select value={currentRole} onValueChange={(value: Role) => onRoleChange(value)}>
      <SelectTrigger className="w-auto md:w-[180px] gap-2">
        <CurrentIcon className="h-4 w-4 text-muted-foreground" />
        <div className="hidden md:block">
            <SelectValue placeholder="Select a role" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {roles.map(({ value, label, icon: Icon }) => (
          <SelectItem key={value} value={value}>
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
