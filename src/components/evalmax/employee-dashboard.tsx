'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getFullEvaluationResults } from '@/lib/data';
import type { EvaluationResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = React.useState('2025-07');
  const [result, setResult] = React.useState<EvaluationResult | null>(null);

  React.useEffect(() => {
    if (user) {
      const allResults = getFullEvaluationResults();
      const userResult = allResults.find(r => r.id === user.employeeId);
      setResult(userResult || null);
    }
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  }

  if (!user || !result) {
    return <div>결과를 불러오는 중입니다...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold font-headline tracking-tight">내 성과 리뷰</h2>
        <Select defaultValue={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="기간 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025-07">2025년 7월</SelectItem>
            <SelectItem value="2025-06" disabled>2025년 6월</SelectItem>
            <SelectItem value="2025-05" disabled>2025년 5월</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">평가 결과: {selectedPeriod}</CardTitle>
          <CardDescription>
            선택한 기간의 성과 평가 및 보상 요약입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="font-semibold font-headline">내 정보</h3>
                <InfoItem label="이름" value={result.name} />
                <InfoItem label="소속부서" value={result.department} />
                <InfoItem label="직책" value={result.title} />
                <InfoItem label="평가자" value={result.evaluatorName} />
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold font-headline">성과 상세</h3>
                <InfoItem label="등급" value={<span className="font-bold text-primary text-2xl">{result.grade}</span>} />
                <InfoItem label="점수" value={`${result.score} / 150`} />
                <InfoItem label="근무율" value={`${(result.workRate * 100).toFixed(1)}%`} />
                <InfoItem label="근무율 그룹" value={result.detailedGroup1} />
            </div>
          </div>
          <Separator className="my-6"/>
          <div>
            <h3 className="font-semibold font-headline mb-4">보상 내역</h3>
            <div className="space-y-2 text-sm">
                <CalculationRow label="기준 금액 (B등급)" value={formatCurrency(result.baseAmount)} />
                <CalculationRow label={`내 지급률 (${result.grade} 등급)`} value={`${result.score}%`} />
                <CalculationRow label="산출 등급 금액" value={formatCurrency(result.gradeAmount)} isSubtotal/>
                <CalculationRow label={`근무율 조정`} value={`x ${(result.workRate).toFixed(2)}`} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 rounded-b-lg">
            <div className="flex justify-between items-center w-full">
                <span className="font-bold text-lg font-headline">최종 성과급</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(result.finalAmount)}</span>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | React.ReactNode }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}


function CalculationRow({ label, value, isSubtotal = false }: { label: string; value: string | React.ReactNode, isSubtotal?: boolean }) {
    return (
        <div className={`flex justify-between items-center py-1 ${isSubtotal ? 'border-t border-b my-2 py-2' : ''}`}>
            <p className="text-muted-foreground">{label}</p>
            <p className={`font-mono ${isSubtotal ? 'font-semibold' : ''}`}>{value}</p>
        </div>
    );
}
