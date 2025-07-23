'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Save } from 'lucide-react';

interface PersonalSettingsProps {
  user: User;
  onUserUpdate: (userId: string, updatedData: Partial<User>) => void;
}

export default function PersonalSettings({ user, onUserUpdate }: PersonalSettingsProps) {
  const { toast } = useToast();
  const [department, setDepartment] = React.useState(user.department);
  const [title, setTitle] = React.useState(user.title);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleSaveChanges = () => {
    if (password && password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '비밀번호가 일치하지 않습니다.',
      });
      return;
    }

    const updatedData: Partial<User> = {
      uniqueId: user.uniqueId,
      department,
      title,
    };

    if (password) {
      updatedData.password = password;
    }

    onUserUpdate(user.id, updatedData);

    toast({
      title: '저장 완료',
      description: '개인정보가 성공적으로 업데이트되었습니다.',
    });
    
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>개인정보 설정</CardTitle>
          <CardDescription>
            부서, 직책 및 비밀번호를 수정할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="department">부서</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">직책</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">새 비밀번호 (변경 시에만 입력)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 확인"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              변경사항 저장
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
