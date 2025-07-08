'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ManageData() {
  const { toast } = useToast();

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

  const handleDownloadTemplate = () => {
    const headers = [
      '고유사번', '사번', '이름', '회사', '소속부서', '호칭', '직책', '성장레벨', 
      '실근무율', '평가그룹', '세부구분1', '세부구분2', '평가자사번', '평가자이름', 
      '개인별 기준금액'
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '평가대상자 양식');
    XLSX.writeFile(workbook, 'evaluation_template.xlsx');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">평가 대상자 데이터 관리</CardTitle>
          <CardDescription>
            엑셀 파일을 업로드하여 평가 대상자 정보를 업데이트하세요. 양식에 맞는 파일을 사용해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="employee-data">엑셀 파일 업로드</Label>
            <Input id="employee-data" type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
          </div>
           <Button onClick={handleDownloadTemplate} variant="outline" className="w-full sm:w-auto sm:mt-auto">
            <Download className="mr-2 h-4 w-4" /> 양식 다운로드
          </Button>
        </CardContent>
        <CardFooter>
            <p className="text-sm text-muted-foreground">
                기존 데이터는 덮어쓰여집니다.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
