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
import { Switch } from '@/components/ui/switch';
import type { User, Role, Employee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, Key, Edit, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContent2,
  AlertDialogDescription as AlertDialogDescription2,
  AlertDialogFooter as AlertDialogFooter2,
  AlertDialogHeader as AlertDialogHeader2,
  AlertDialogTitle as AlertDialogTitle2,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface UserRoleManagementProps {
  allUsers: User[];
  onUserAdd: (newEmployee: Partial<Employee>, roles: Role[]) => void;
  onRolesChange: (userId: string, newRoles: Role[]) => void;
  onUserUpdate: (userId: string, updatedData: Partial<User & { newUniqueId?: string }>) => void;
  onUserDelete: (userId: string) => void;
  onUsersDelete: (userIds: string[]) => void;
}

export default function UserRoleManagement({
  allUsers,
  onUserAdd,
  onRolesChange,
  onUserUpdate,
  onUserDelete,
  onUsersDelete,
}: UserRoleManagementProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<Set<Role>>(new Set());
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = React.useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = React.useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [actionType, setActionType] = React.useState<'resetPassword' | 'delete' | 'bulkDelete' | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());


  // State for adding a new user
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserId, setNewUserId] = React.useState('');
  const [newUserDepartment, setNewUserDepartment] = React.useState('');
  const [newUserTitle, setNewUserTitle] = React.useState('');
  const [newUserRoles, setNewUserRoles] = React.useState<Role[]>(['employee']);
  
  // State for editing an existing user
  const [editUserName, setEditUserName] = React.useState('');
  const [editUserId, setEditUserId] = React.useState('');
  const [editUserDepartment, setEditUserDepartment] = React.useState('');
  const [editUserTitle, setEditUserTitle] = React.useState('');

  const { toast } = useToast();
  
  const handleToggleRoleFilter = (role: Role) => {
    setRoleFilter(prev => {
      const newFilter = new Set(prev);
      if (newFilter.has(role)) {
        newFilter.delete(role);
      } else {
        newFilter.add(role);
      }
      return newFilter;
    });
  };
  
  const filteredUsers = React.useMemo(() => {
    let users = [...allUsers];
    
    // Role filter
    if (roleFilter.size > 0) {
      users = users.filter(user => {
        // If user has no roles, filter out
        if (!user.roles || user.roles.length === 0) return false;
        // Check if any of the user's roles are in the filter set.
        return user.roles.some(role => role && roleFilter.has(role));
      });
    }

    // Search term filter
    if (searchTerm) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.uniqueId.includes(searchTerm) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return users.sort((a,b) => a.name.localeCompare(b.name));
  }, [allUsers, searchTerm, roleFilter]);

  const handleToggleRole = (userId: string, role: 'admin' | 'evaluator' | 'employee') => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const newRoles = new Set(user.roles);
    if (newRoles.has(role)) {
      if(user.roles.length > 1) {
        newRoles.delete(role);
      } else {
        toast({ variant: 'destructive', title: '오류', description: '사용자는 최소 하나 이상의 역할을 가져야 합니다.' });
        return;
      }
    } else {
      newRoles.add(role);
    }
    onRolesChange(userId, Array.from(newRoles).filter(Boolean) as Role[]);
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

    const newUserAsEmployee: Partial<Employee> = {
      uniqueId: newUserId,
      name: newUserName,
      department: newUserDepartment,
      title: newUserTitle,
      position: newUserTitle,
    };
    
    onUserAdd(newUserAsEmployee, newUserRoles);

    toast({ title: '성공', description: `사용자 '${newUserName}'님이 추가되었습니다.` });
    setIsAddUserDialogOpen(false);
    setNewUserName('');
    setNewUserId('');
    setNewUserDepartment('');
    setNewUserTitle('');
    setNewUserRoles(['employee']);
  };
  
  const handleToggleNewUserRole = (role: 'admin' | 'evaluator' | 'employee') => {
    const newRoles = new Set(newUserRoles);
    if (newRoles.has(role)) {
      if(newRoles.size > 1) newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setNewUserRoles(Array.from(newRoles).filter(Boolean) as Role[]);
  };
  
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUserId(user.uniqueId);
    setEditUserName(user.name);
    setEditUserDepartment(user.department);
    setEditUserTitle(user.title);
    setIsEditUserDialogOpen(true);
  }

  const handleEditUser = () => {
    if(!selectedUser) return;
    onUserUpdate(selectedUser.id, {
        newUniqueId: editUserId,
        name: editUserName,
        department: editUserDepartment,
        title: editUserTitle
    });
    toast({ title: "수정 완료", description: "사용자 정보가 업데이트되었습니다." });
    setIsEditUserDialogOpen(false);
    setSelectedUser(null);
  }

  const openConfirmDialog = (user: User | null, type: 'resetPassword' | 'delete' | 'bulkDelete') => {
    if (type === 'bulkDelete') {
        const adminUser = allUsers.find(u => u.uniqueId === 'admin');
        if (adminUser && selectedIds.has(adminUser.id)) {
            const newSelection = new Set(selectedIds);
            newSelection.delete(adminUser.id);
            if (newSelection.size === 0) {
                 toast({ title: '정보', description: '관리자 계정은 삭제할 수 없습니다. 다른 사용자들을 선택 해제했습니다.' });
                 setSelectedIds(newSelection);
                 return;
            } else {
                 toast({ title: '정보', description: '관리자 계정은 삭제할 수 없어 선택 해제되었습니다.' });
                 setSelectedIds(newSelection);
            }
        }
    }
    setSelectedUser(user);
    setActionType(type);
    setIsConfirmDialogOpen(true);
  }
  
  const handleConfirmAction = () => {
    if(actionType === 'bulkDelete') {
        const idsToDelete = Array.from(selectedIds);
        onUsersDelete(idsToDelete);
        toast({ title: '삭제 완료', description: `${idsToDelete.length}명의 사용자가 삭제되었습니다.` });
        setSelectedIds(new Set());
    } else if (selectedUser) {
        if(actionType === 'resetPassword') {
            onUserUpdate(selectedUser.id, { password: '1' });
            toast({ title: '초기화 완료', description: `사용자 '${selectedUser.name}'의 비밀번호가 '1'로 초기화되었습니다.`});
        } else if (actionType === 'delete') {
            onUserDelete(selectedUser.id);
            toast({ title: '삭제 완료', description: `사용자 '${selectedUser.name}'이(가) 삭제되었습니다.` });
        }
    }
    setIsConfirmDialogOpen(false);
    setSelectedUser(null);
    setActionType(null);
  }
  
  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      const allSelectableIds = filteredUsers
        .filter(u => u.uniqueId !== 'admin')
        .map(u => u.id);
      setSelectedIds(new Set(allSelectableIds));
    } else {
      setSelectedIds(new Set());
    }
  };
  
  const handleToggleRow = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      return newSelection;
    });
  };

  const confirmDialogContent = React.useMemo(() => {
    if (actionType === 'bulkDelete') {
      return {
        title: '선택 항목 삭제',
        description: `정말로 선택한 ${selectedIds.size}명의 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      };
    }
    if (!selectedUser) return { title: '', description: '' };
    if (actionType === 'resetPassword') {
        return {
            title: '비밀번호 초기화',
            description: `정말로 '${selectedUser.name}' 사용자의 비밀번호를 '1'로 초기화하시겠습니까?`
        }
    }
    if (actionType === 'delete') {
        return {
            title: '사용자 삭제',
            description: `정말로 '${selectedUser.name}' 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
        }
    }
    return { title: '', description: '' };
  }, [selectedUser, actionType, selectedIds]);

  const isAllSelected = React.useMemo(() => {
    const selectableUsers = filteredUsers.filter(u => u.uniqueId !== 'admin');
    if (selectableUsers.length === 0) return false;
    return selectableUsers.every(u => selectedIds.has(u.id));
  }, [filteredUsers, selectedIds]);
  

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
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, ID, 부서로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
                <Button variant={roleFilter.has('employee') ? 'default': 'outline'} size="sm" onClick={() => handleToggleRoleFilter('employee')}>피평가자</Button>
                <Button variant={roleFilter.has('evaluator') ? 'default': 'outline'} size="sm" onClick={() => handleToggleRoleFilter('evaluator')}>평가자</Button>
                <Button variant={roleFilter.has('admin') ? 'default': 'outline'} size="sm" onClick={() => handleToggleRoleFilter('admin')}>관리자</Button>
                <Button onClick={() => setIsAddUserDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  사용자 추가
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => openConfirmDialog(null, 'bulkDelete')}
                    disabled={selectedIds.size === 0}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    선택 항목 삭제 ({selectedIds.size})
                </Button>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleToggleAll(Boolean(checked))}
                        aria-label="모두 선택"
                    />
                  </TableHead>
                  <TableHead className="text-center">ID (고유사번)</TableHead>
                  <TableHead className="text-center">이름</TableHead>
                  <TableHead className="text-center">부서</TableHead>
                  <TableHead className="text-center">직책</TableHead>
                  <TableHead className="w-[100px] text-center">피평가자</TableHead>
                  <TableHead className="w-[100px] text-center">평가자</TableHead>
                  <TableHead className="w-[100px] text-center">관리자</TableHead>
                  <TableHead className="w-[200px] text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-state={selectedIds.has(user.id) ? "selected" : undefined}>
                    <TableCell className="text-center">
                        <Checkbox
                            checked={selectedIds.has(user.id)}
                            onCheckedChange={(checked) => handleToggleRow(user.id, Boolean(checked))}
                            aria-label={`${user.name} 선택`}
                            disabled={user.uniqueId === 'admin'}
                        />
                    </TableCell>
                    <TableCell className="text-center font-mono">{user.uniqueId}</TableCell>
                    <TableCell className="text-center font-semibold">{user.name}</TableCell>
                    <TableCell className="text-center">{user.department}</TableCell>
                    <TableCell className="text-center">{user.title}</TableCell>
                     <TableCell className="text-center">
                      <Switch
                        checked={user.roles.includes('employee')}
                        onCheckedChange={() => handleToggleRole(user.id, 'employee')}
                      />
                    </TableCell>
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
                        disabled={user.uniqueId === 'admin'}
                      />
                    </TableCell>
                    <TableCell className="text-center space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openConfirmDialog(user, 'resetPassword')}>
                            <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        {user.uniqueId !== 'admin' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openConfirmDialog(user, 'delete')}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
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
              <Label htmlFor="new-user-id" className="text-right">ID (고유사번)</Label>
              <Input id="new-user-id" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-user-name" className="text-right">이름</Label>
              <Input id="new-user-name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-user-department" className="text-right">부서</Label>
              <Input id="new-user-department" value={newUserDepartment} onChange={(e) => setNewUserDepartment(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-user-title" className="text-right">직책</Label>
              <Input id="new-user-title" value={newUserTitle} onChange={(e) => setNewUserTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">역할</Label>
              <div className="col-span-3 flex items-center gap-4">
                 <div className="flex items-center gap-2">
                  <Switch id="new-role-employee" checked={newUserRoles.includes('employee')} onCheckedChange={() => handleToggleNewUserRole('employee')} />
                  <Label htmlFor="new-role-employee">피평가자</Label>
                </div>
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

       <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-user-id" className="text-right">ID (고유사번)</Label>
              <Input id="edit-user-id" value={editUserId} onChange={(e) => setEditUserId(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-user-name" className="text-right">이름</Label>
              <Input id="edit-user-name" value={editUserName} onChange={(e) => setEditUserName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-user-department" className="text-right">부서</Label>
              <Input id="edit-user-department" value={editUserDepartment} onChange={(e) => setEditUserDepartment(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-user-title" className="text-right">직책</Label>
              <Input id="edit-user-title" value={editUserTitle} onChange={(e) => setEditUserTitle(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>취소</Button>
            <Button onClick={handleEditUser}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent2>
            <AlertDialogHeader2>
                <AlertDialogTitle2>{confirmDialogContent.title}</AlertDialogTitle2>
                <AlertDialogDescription2>
                    {confirmDialogContent.description}
                </AlertDialogDescription2>
            </AlertDialogHeader2>
            <AlertDialogFooter2>
                <AlertDialogCancel onClick={() => setIsConfirmDialogOpen(false)}>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAction}>확인</AlertDialogAction>
            </AlertDialogFooter2>
        </AlertDialogContent2>
      </AlertDialog>
    </div>
  );
}
