'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { User, Role, Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '../ui/switch';

interface UserRoleManagementProps {
  allUsers: User[];
  allEmployees: Employee[];
  onUserAdd: (newEmployee: Employee, roles: Role[]) => void;
  onRolesChange: (userId: string, newRoles: Role[]) => void;
}

export default function UserRoleManagement({
  allUsers,
  allEmployees,
  onUserAdd,
  onRolesChange,
}: UserRoleManagementProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = React.useState(false);
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserId, setNewUserId] = React.useState('');
  const [newUserRoles, setNewUserRoles] = React.useState<Role[]>(['employee']);
  const { toast } = useToast();

  const handleToggleRole = (userId: string, role: 'admin' | 'evaluator') => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const newRoles = new Set(user.roles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    
    // Ensure 'employee' role is always present
    if (!newRoles.has('employee')) {
        newRoles.add('employee');
    }

    onRolesChange(userId, Array.from(newRoles) as Role[]);
  };

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserId.trim()) {
      toast({ variant: 'destructive', title: '오류', description: '사용자 이름과 ID를 모두 입력해주세요.' });
      return;
    }
    if (allUsers.some(u => u.uniqueId === newUserId)) {
      toast({ variant: 'destructive', title: '오류', description: '이미 존재하는 ID입니다.' });
      return;
    }

    const newUserAsEmployee: Employee = {
      id: `E${newUserId}`,
      uniqueId: newUserId,
      name: newUserName,
      company: 'N/A',
      department: 'N/A',
      title: '미지정',
      position: '미지정',
      growthLevel: '',
      workRate: 1.0,
      evaluatorId: '',
      baseAmount: 0,
      memo: '신규 추가된 사용자'
    };
    
    onUserAdd(newUserAsEmployee, newUserRoles);

    toast({ title: '성공', description: `사용자 '${newUserName}'님이 추가되었습니다.` });
    setIsAddUserDialogOpen(false);
    setNewUserName('');
    setNewUserId('');
    setNewUserRoles(['employee']);
  };
  
  const handleToggleNewUserRole = (role: 'admin' | 'evaluator') => {
    const newRoles = new Set(newUserRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setNewUserRoles(Array.from(newRoles));
  }

  const filteredUsers = React.useMemo(() => {
    if (!searchTerm) return allUsers;
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.uniqueId.includes(searchTerm) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>사용자 및 권한 관리</CardTitle>
          <CardDescription>
            시스템에 접근할 수 있는 사용자를 관리하고, 역할을 부여합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, ID, 부서로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              사용자 추가
            </Button>
          </div>
          
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">ID (고유사번)</TableHead>
                  <TableHead className="text-center">이름</TableHead>
                  <TableHead className="text-center">부서</TableHead>
                  <TableHead className="text-center">직책</TableHead>
                  <TableHead className="w-[100px] text-center">평가자</TableHead>
                  <TableHead className="w-[100px] text-center">관리자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-center font-mono">{user.uniqueId}</TableCell>
                    <TableCell className="text-center font-semibold">{user.name}</TableCell>
                    <TableCell className="text-center">{user.department}</TableCell>
                    <TableCell className="text-center">{user.title}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={user.roles.includes('evaluator')}
                        onCheckedChange={() => handleToggleRole(user.id, 'evaluator')}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={user.roles.includes('admin')}
                        onCheckedChange={() => handleToggleRole(user.id, 'admin')}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 사용자 추가</DialogTitle>
            <DialogDescription>
              시스템에 로그인할 수 있는 새 사용자를 추가하고 역할을 할당합니다. 비밀번호는 '1'로 초기화됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-user-name" className="text-right">이름</Label>
              <Input id="new-user-name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-user-id" className="text-right">ID (고유사번)</Label>
              <Input id="new-user-id" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">역할</Label>
              <div className="col-span-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="new-role-evaluator" checked={newUserRoles.includes('evaluator')} onCheckedChange={() => handleToggleNewUserRole('evaluator')} />
                  <Label htmlFor="new-role-evaluator">평가자</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="new-role-admin" checked={newUserRoles.includes('admin')} onCheckedChange={() => handleToggleNewUserRole('admin')} />
                  <Label htmlFor="new-role-admin">관리자</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>취소</Button>
            <Button onClick={handleAddUser}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
