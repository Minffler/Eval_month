'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { mockEvaluations } from '@/lib/data';
import { validateGradeConsistency } from '@/ai/flows/grade-consistency-validation';

const formSchema = z.object({
  gradeData: z.string().min(10, '등급 데이터가 필요합니다.'),
  expectedDistribution: z.string().min(10, '예상 분포 설명이 필요합니다.'),
});

const defaultGradeData = JSON.stringify(
  mockEvaluations.map(({ employeeId, grade }) => ({ employeeId, grade })),
  null,
  2
);

const defaultExpectedDistribution =
  '대부분의 직원은 B 또는 B+ 등급을 받아야 하며, S 또는 D 등급을 받는 직원은 소수여야 합니다. 등급 분포는 부서 간에 비교적 균등해야 하며, 특정 그룹에 치우치지 않아야 합니다.';

export function ConsistencyValidator() {
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gradeData: defaultGradeData,
      expectedDistribution: defaultExpectedDistribution,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setReport(null);
    try {
      const result = await validateGradeConsistency(values);
      setReport(result.consistencyReport);
    } catch (error) {
      console.error('Error validating consistency:', error);
      setReport('리포트를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">등급 일관성 분석</CardTitle>
          <CardDescription>
            AI 기반 도구를 사용하여 등급 분포를 분석하고 잠재적인 불일치나 편향을 식별하세요.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="gradeData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>등급 데이터 (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="여기에 등급 데이터를 붙여넣으세요"
                        className="h-48 font-code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedDistribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>예상 분포</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="예상 등급 분포에 대해 설명해주세요"
                        className="h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      조직에 이상적인 공정한 분포가 무엇인지 설명해주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                AI로 분석하기
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">AI 일관성 리포트</CardTitle>
          <CardDescription>
            생성된 리포트가 아래에 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md border p-4 min-h-[400px]">
          {loading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {report ? report : !loading && <p className="text-muted-foreground">리포트가 여기에 생성됩니다...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
