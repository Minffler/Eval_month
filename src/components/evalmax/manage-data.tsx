'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee } from '@/lib/types';

interface ManageDataProps {
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export default function ManageData({ setEmployees }: ManageDataProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);

          const newEmployees: Employee[] = json.map(row => ({
            id: row['사번'],
            uniqueId: row['고유사번'],
            name: row['이름'],
            company: row['회사'],
            department: row['소속부서'],
            title: row['직책'],
            position: row['호칭'],
            growthLevel: row['성장레벨'],
            workRate: parseFloat(row['실근무율']) || 0,
            group: row['평가그룹'],
            evaluatorId: row['평가자사번'],
            baseAmount: Number(row['개인별 기준금액']) || 0,
            deductionHours: { attendance: 0, shortened: 0, total: 0 }, 
          }));

          setEmployees(newEmployees);
          toast({
            title: '파일 업로드 성공',
            description: `${file.name} 파일의 데이터가 성공적으로 반영되었습니다.`,
          });
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          toast({
            variant: "destructive",
            title: '파일 처리 오류',
            description: '엑셀 파일을 처리하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.',
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
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
          <CardTitle>평가 대상자 데이터 관리</CardTitle>
          <CardDescription>
            엑셀 파일을 업로드하여 평가 대상자 정보를 업데이트하세요. 양식에 맞는 파일을 사용해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="employee-data">엑셀 파일 업로드</Label>
            <Input id="employee-data" type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} ref={fileInputRef} />
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
