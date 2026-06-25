import assert from 'node:assert/strict';
import http from 'node:http';

export const listen = (server: http.Server): Promise<number> => (
  new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('Server did not bind to a TCP port.'));
        return;
      }
      resolve(address.port);
    });
  })
);

export const close = (server: http.Server): Promise<void> => (
  new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  })
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

export const readJsonObject = async (response: Response): Promise<Record<string, unknown>> => {
  const data: unknown = await response.json();
  assert.ok(isRecord(data));
  return data;
};

export const readRequestBody = async (req: http.IncomingMessage): Promise<string> => (
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  })
);

export const isVisionProbeRequest = (body: string): boolean => (
  body.includes('capability detector') && body.includes('image_url')
);

export const buildRouteResponse = () => ({
  needLegalFinance: false,
  needLegalCommerce: false,
  needLegalNet: false,
  needSocial: false,
  needEsg: false,
  needPrivacy: false,
  needYouth: false,
  needCopyright: false,
  legalProductSegment: '',
});

export const buildCleanAnalysisResponse = () => ({
  parsedMeta: {
    productType: '일반광고',
    targets: '일반 대중',
    regulatoryDomain: '표시광고법',
    channels: '모든 채널',
  },
  score: 100,
  violations: [],
  matchedLaws: [],
  imageAlternativeProposal: {
    detectedVisualCopys: [],
    visualViolations: [],
    visualRemediationSteps: [],
    alternativeVisualDraft: '',
  },
});
