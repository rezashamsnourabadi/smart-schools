export class ApiError extends Error {
  constructor(public statusCode: number, public code: string, message: string) { super(message); }
}
export const deny = () => { throw new ApiError(403, 'FORBIDDEN', 'دسترسی به این عملیات مجاز نیست.'); };
export function requireValue(condition: unknown, message: string, status = 422): asserts condition {
  if (!condition) throw new ApiError(status, ({403:'FORBIDDEN',404:'NOT_FOUND',409:'CONFLICT',429:'RATE_LIMIT',503:'UNAVAILABLE'} as Record<number,string>)[status]||'VALIDATION', message);
}
