'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkRateManagement() {

  return (
    <Card>
        <CardHeader>
            <CardTitle>근무율 조회</CardTitle>
            <CardDescription>
                월별 소정근로시간, 근태 사용, 단축근로 등을 종합하여 최종 근무율을 조회합니다. (구현 예정)
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">근무율 조회 기능이 여기에 표시됩니다.</p>
            </div>
        </CardContent>
    </Card>
  );
}
