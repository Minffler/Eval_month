'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EvaluationResult, User } from '@/lib/types';

interface NotificationManagementProps {
  results: EvaluationResult[];
  userMap: Map<string, User>;
  addNotification: (notification: { recipientId: string; message: string }) => void;
}

export default function NotificationManagement({ 
  results, 
  userMap, 
  addNotification 
}: NotificationManagementProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEvaluators, setSelectedEvaluators] = React.useState<Set<string>>(new Set());
  const [notificationMessage, setNotificationMessage] = React.useState('');
  const [notificationTemplates, setNotificationTemplates] = React.useState<string[]>([
    '평가 기간이 종료되었습니다. 미완료된 평가를 완료해주세요.',
    '평가 결과가 반영되었습니다. 확인해주세요.',
    '평가 기간이 시작되었습니다. 평가를 진행해주세요.',
  ]);

  const evaluatorStats = React.useMemo(() => {
    const evaluatorMap = new Map<string, { name: string; total: number; completed: number; pending: number }>();
    
    results.forEach(result => {
      if (result.evaluatorId) {
        const existing = evaluatorMap.get(result.evaluatorId);
        if (existing) {
          existing.total++;
          if (result.grade) {
            existing.completed++;
          } else {
            existing.pending++;
          }
        } else {
          const evaluator = userMap.get(result.evaluatorId);
          evaluatorMap.set(result.evaluatorId, {
            name: evaluator?.name || 'Unknown',
            total: 1,
            completed: result.grade ? 1 : 0,
            pending: result.grade ? 0 : 1,
          });
        }
      }
    });

    return Array.from(evaluatorMap.entries()).map(([id, stats]) => ({
      evaluatorUniqueId: id,
      evaluatorName: stats.name,
      total: stats.total,
      completed: stats.completed,
      pending: stats.pending,
      rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    }));
  }, [results, userMap]);

  const handleSelectAllEvaluators = React.useCallback((checked: boolean) => {
    if (checked) {
      setSelectedEvaluators(new Set(evaluatorStats.map(e => e.evaluatorUniqueId)));
    } else {
      setSelectedEvaluators(new Set());
    }
  }, [evaluatorStats]);

  const handleSelectEvaluator = React.useCallback((evaluatorId: string, checked: boolean) => {
    setSelectedEvaluators(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(evaluatorId);
      } else {
        next.delete(evaluatorId);
      }
      return next;
    });
  }, []);

  const handleSelectIncompleteEvaluators = React.useCallback(() => {
    const incompleteEvaluators = evaluatorStats
      .filter(e => e.pending > 0)
      .map(e => e.evaluatorUniqueId);
    setSelectedEvaluators(new Set(incompleteEvaluators));
  }, [evaluatorStats]);

  const handleSendNotifications = React.useCallback(() => {
    if (selectedEvaluators.size === 0) {
      toast({
        title: '선택된 평가자가 없습니다',
        description: '알림을 보낼 평가자를 선택해주세요.',
        variant: 'destructive'
      });
      return;
    }

    if (!notificationMessage.trim()) {
      toast({
        title: '알림 내용이 없습니다',
        description: '알림 내용을 입력해주세요.',
        variant: 'destructive'
      });
      return;
    }

    selectedEvaluators.forEach(evaluatorId => {
      addNotification({
        recipientId: evaluatorId,
        message: notificationMessage,
      });
    });

    toast({
      title: '알림 전송 완료',
      description: `${selectedEvaluators.size}명의 평가자에게 알림이 전송되었습니다.`,
    });

    setIsDialogOpen(false);
    setSelectedEvaluators(new Set());
    setNotificationMessage('');
  }, [selectedEvaluators, notificationMessage, addNotification, toast]);

  const handleSaveTemplate = React.useCallback(() => {
    if (!notificationMessage.trim()) return;
    
    setNotificationTemplates(prev => {
      if (!prev.includes(notificationMessage)) {
        return [...prev, notificationMessage];
      }
      return prev;
    });
    
    toast({
      title: '템플릿 저장 완료',
      description: '알림 템플릿이 저장되었습니다.',
    });
  }, [notificationMessage, toast]);

  const handleDeleteTemplate = React.useCallback((templateToDelete: string) => {
    setNotificationTemplates(prev => prev.filter(t => t !== templateToDelete));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">알림 관리</h2>
          <p className="text-muted-foreground">시스템 알림과 결재 요청을 관리합니다.</p>
        </div>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>시스템 알림</CardTitle>
          <CardDescription>전체 사용자에게 전송된 알림들을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white border-b border-border">
                    <TableHead className="text-center">제목</TableHead>
                    <TableHead className="text-center">내용</TableHead>
                    <TableHead className="text-center">발송일</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="text-center">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="text-center">{notification.title}</TableCell>
                      <TableCell className="text-center">{notification.message}</TableCell>
                      <TableCell className="text-center">{formatDateTime(notification.date)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={notification.isRead ? 'secondary' : 'default'}>
                          {notification.isRead ? '읽음' : '안읽음'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleNotificationAction(notification.id, 'delete')}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">새로운 알림이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>결재 요청</CardTitle>
          <CardDescription>승인 대기 중인 요청들을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {approvals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white border-b border-border">
                    <TableHead className="text-center">요청자</TableHead>
                    <TableHead className="text-center">요청 유형</TableHead>
                    <TableHead className="text-center">요청일</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="text-center">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell className="text-center">{approval.requesterName}</TableCell>
                      <TableCell className="text-center">{approval.payload.dataType}</TableCell>
                      <TableCell className="text-center">{formatDateTime(approval.date)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={approval.status === 'pending' ? 'secondary' : 'default'}>
                          {approval.status === 'pending' ? '대기중' : '처리됨'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {approval.status === 'pending' && (
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleApprovalAction(approval.id, 'approve')}>
                              승인
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleApprovalAction(approval.id, 'reject')}>
                              거부
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">새로운 결재내역이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 