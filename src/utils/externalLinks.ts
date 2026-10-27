export function safeExternalUrl(value: unknown): string | undefined {
  if(typeof value !== 'string' || value.length > 2048)return undefined;
  try {
    const url=new URL(value.trim());
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return undefined;
    return url.href;
  } catch {return undefined;}
}
