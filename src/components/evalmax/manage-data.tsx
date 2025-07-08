'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save } from 'lucide-react';
import { baseCompensationAmount } from '@/lib/data';

export default function ManageData() {
  const { toast } = useToast();
  const [baseAmount, setBaseAmount] = React.useState(baseCompensationAmount);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: '파일 업로드 성공',
        description: `${file.name} 파일이 업로드되었습니다.`,
      });
      // 여기에 파일 처리 로직을 추가할 수 있습니다.
    }
  };

  const handleSaveSettings = () => {
    toast({
      title: '설정 저장됨',
      description: `기준 금액이 ${new Intl.NumberFormat('ko-KR').format(baseAmount)}원으로 업데이트되었습니다.`,
    });
    // 여기에 기준 금액 저장 로직을 추가할 수 있습니다.
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">평가 대상자 데이터 관리</CardTitle>
          <CardDescription>
            엑셀 파일을 업로드하여 평가 대상자 정보를 업데이트하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="employee-data">엑셀 파일 업로드</Label>
            <Input id="employee-data" type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-sm text-muted-foreground">
                양식에 맞는 엑셀 파일을 업로드해주세요. 기존 데이터는 덮어쓰여집니다.
            </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">기준 금액 관리</CardTitle>
          <CardDescription>
            B등급을 기준으로 하는 월별 성과급 기준 금액을 설정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-2">
            <Label htmlFor="base-amount">기준 금액 (원)</Label>
            <Input 
              id="base-amount" 
              type="number" 
              value={baseAmount}
              onChange={(e) => setBaseAmount(Number(e.target.value))}
              placeholder="예: 5000000"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" /> 저장하기
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
