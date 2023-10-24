import { createHmac } from 'node:crypto';

export { db } from './dbClient';

export { numberAdd, numberDiv, numberMul, numberSub } from './num-utils';

export function hmacSha256(text: string, key: string) {
  const hash = createHmac('sha256', key);
  hash.update(text);
  return hash.digest('hex');
}
