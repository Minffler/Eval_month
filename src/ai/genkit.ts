import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({
    apiVersion: 'v1beta',
    apiKey: 'AIzaSyAVBSAu4xYSoPeirrMkgPb6HsVcFD8xmg4'
  })],
  model: 'gemini-1.5-flash',
});