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
    return <div>Loading your results...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold font-headline tracking-tight">My Performance Review</h2>
        <Select defaultValue={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025-07">July 2025</SelectItem>
            <SelectItem value="2025-06" disabled>June 2025</SelectItem>
            <SelectItem value="2025-05" disabled>May 2025</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Evaluation Result: {selectedPeriod}</CardTitle>
          <CardDescription>
            Here is a summary of your performance evaluation and compensation for the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="font-semibold font-headline">Your Information</h3>
                <InfoItem label="Name" value={result.name} />
                <InfoItem label="Department" value={result.department} />
                <InfoItem label="Title" value={result.title} />
                <InfoItem label="Evaluator" value={result.evaluatorName} />
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold font-headline">Performance Details</h3>
                <InfoItem label="Grade" value={<span className="font-bold text-primary text-2xl">{result.grade}</span>} />
                <InfoItem label="Score" value={`${result.score} / 150`} />
                <InfoItem label="Work Rate" value={`${(result.workRate * 100).toFixed(1)}%`} />
            </div>
          </div>
          <Separator className="my-6"/>
          <div>
            <h3 className="font-semibold font-headline mb-4">Compensation Breakdown</h3>
            <div className="space-y-2 text-sm">
                <CalculationRow label="Base Amount (B Grade)" value={formatCurrency(result.baseAmount)} />
                <CalculationRow label={`Your Payout Rate (${result.grade} Grade)`} value={`${result.score}%`} />
                <CalculationRow label="Calculated Grade Amount" value={formatCurrency(result.gradeAmount)} isSubtotal/>
                <CalculationRow label={`Work Rate Adjustment`} value={`x ${(result.workRate).toFixed(2)}`} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 rounded-b-lg">
            <div className="flex justify-between items-center w-full">
                <span className="font-bold text-lg font-headline">Final Performance Pay</span>
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
