'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { DetailDialogInfo } from './work-rate-types';

interface WorkRateDetailDialogProps {
  detailDialog: DetailDialogInfo;
  onClose: () => void;
}

export default function WorkRateDetailDialog({
  detailDialog,
  onClose,
}: WorkRateDetailDialogProps) {
  const formatDate = React.useCallback((dateString: string) => {
    try {
      return format(new Date(dateString.replace(/\./g, '-')), 'yyyy.MM.dd');
    } catch {
      return dateString;
    }
  }, []);

  const formatTime = React.useCallback((timeString: string) => {
    return timeString;
  }, []);

  const getTypeBadge = React.useCallback((type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'shortenedWork': 'secondary',
      'pregnancy': 'destructive',
      'care': 'outline',
    };
    
    const labels: Record<string, string> = {
      'shortenedWork': '단축근무',
      'pregnancy': '임신',
      'care': '돌봄',
    };

    return (
      <Badge variant={variants[type] || 'default'}>
        {labels[type] || type}
      </Badge>
    );
  }, []);

  return (
    <Dialog open={detailDialog.isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detailDialog.title}</DialogTitle>
          <DialogDescription>
            {detailDialog.type === 'attendance' ? '일별 근태 상세 정보' : '단축근무 상세 정보'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {detailDialog.type === 'attendance' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>근태 유형</TableHead>
                  <TableHead>공제 시간</TableHead>
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailDialog.data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeBadge(item.type)}
                        <span>{item.typeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.deductionHours.toFixed(1)}h</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.memo || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기간</TableHead>
                  <TableHead>근무 시간</TableHead>
                  <TableHead>실제 근무</TableHead>
                  <TableHead>일 공제</TableHead>
                  <TableHead>영업일</TableHead>
                  <TableHead>총 공제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailDialog.data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{formatDate(item.startDate)} ~ {formatDate(item.endDate)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(item.startTime)} ~ {formatTime(item.endTime)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.workHours.toFixed(1)}h</TableCell>
                    <TableCell>{item.actualWorkHours.toFixed(1)}h</TableCell>
                    <TableCell>{item.dailyDeductionHours.toFixed(1)}h</TableCell>
                    <TableCell>{item.businessDays}일</TableCell>
                    <TableCell className="font-semibold">
                      {item.totalDeductionHours.toFixed(1)}h
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 