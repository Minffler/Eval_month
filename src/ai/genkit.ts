import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Node.js 환경에서 SSL 인증서 검증 우회
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const ai = genkit({
  plugins: [googleAI({
    apiVersion: 'v1beta',
    apiKey: 'AIzaSyAVBSAu4xYSoPeirrMkgPb6HsVcFD8xmg4'
  })]
});