import {networkInterfaces} from 'node:os';

/** LAN access is restricted to this machine's addresses and the public dev port. */
export function isAllowedOrigin(
  origin: string,
  appOrigin: string,
  environment: 'development' | 'test' | 'production',
  localAddresses?: readonly string[],
): boolean {
  if (origin === appOrigin) return true;
  if (environment !== 'development') return false;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.protocol !== 'http:' || url.port !== '3000') return false;
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
    const addresses = localAddresses ?? Object.values(networkInterfaces()).flatMap(items => items?.map(item => item.address) ?? []);
    return addresses.includes(hostname);
  } catch {
    return false;
  }
}
