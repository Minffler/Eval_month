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
  gradeData: z.string().min(10, 'Grade data is required.'),
  expectedDistribution: z.string().min(10, 'Expected distribution is required.'),
});

const defaultGradeData = JSON.stringify(
  mockEvaluations.map(({ employeeId, grade }) => ({ employeeId, grade })),
  null,
  2
);

const defaultExpectedDistribution =
  'Most employees should receive a B or B+ grade, with fewer employees receiving S or D grades. The distribution should be relatively even across departments, with no significant skew towards one particular group.';

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
      setReport('An error occurred while generating the report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Analyze Grade Consistency</CardTitle>
          <CardDescription>
            Use our AI-powered tool to analyze grade distributions and identify potential inconsistencies or biases.
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
                    <FormLabel>Grade Data (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste grade data here"
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
                    <FormLabel>Expected Distribution</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the expected grade distribution"
                        className="h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what a fair distribution looks like for your organization.
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
                Analyze with AI
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">AI Consistency Report</CardTitle>
          <CardDescription>
            The generated report will appear below.
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md border p-4 min-h-[400px]">
          {loading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {report ? report : !loading && <p className="text-muted-foreground">Your report will be generated here...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
