import { config } from 'dotenv';
config();

import '@/ai/flows/grade-consistency-validation.ts';
import '@/ai/flows/backup-data-flow.ts';
import '@/ai/flows/restore-data-flow.ts';
