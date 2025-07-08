'use server';

/**
 * @fileOverview This file defines a Genkit flow for validating grade consistency across different teams and departments.
 *
 * - validateGradeConsistency - A function that validates grade consistency.
 * - ValidateGradeConsistencyInput - The input type for the validateGradeConsistency function.
 * - ValidateGradeConsistencyOutput - The return type for the validateGradeConsistency function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateGradeConsistencyInputSchema = z.object({
  gradeData: z
    .string()
    .describe(
      'A string containing grade distributions for different teams and departments in the organization.'
    ),
  expectedDistribution: z
    .string()
    .describe(
      'A string describing the expected grade distribution across the organization. For example: Most employees should receive a B or B+ grade, with fewer employees receiving S or D grades.'
    ),
});

export type ValidateGradeConsistencyInput = z.infer<
  typeof ValidateGradeConsistencyInputSchema
>;

const ValidateGradeConsistencyOutputSchema = z.object({
  consistencyReport: z
    .string()
    .describe(
      'A report indicating whether the grade distributions are consistent with the expected distribution, and highlighting any potential inconsistencies or biases.'
    ),
});

export type ValidateGradeConsistencyOutput = z.infer<
  typeof ValidateGradeConsistencyOutputSchema
>;

export async function validateGradeConsistency(
  input: ValidateGradeConsistencyInput
): Promise<ValidateGradeConsistencyOutput> {
  return validateGradeConsistencyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateGradeConsistencyPrompt',
  input: {schema: ValidateGradeConsistencyInputSchema},
  output: {schema: ValidateGradeConsistencyOutputSchema},
  prompt: `You are an HR analyst tasked with validating grade consistency across different teams and departments.

  Analyze the provided grade data and determine if the distributions are consistent with the expected distribution.
  Highlight any potential inconsistencies or biases in your report.

  Grade Data: {{{gradeData}}}
  Expected Distribution: {{{expectedDistribution}}}
  `,
});

const validateGradeConsistencyFlow = ai.defineFlow(
  {
    name: 'validateGradeConsistencyFlow',
    inputSchema: ValidateGradeConsistencyInputSchema,
    outputSchema: ValidateGradeConsistencyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
