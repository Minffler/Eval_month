import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({
    apiVersion: 'v1beta',
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyAVBSAu4xYSoPeirrMkgPb6HsVcFD8xmg4'
  })],
  model: 'googleai/gemini-2.5-pro',
});
