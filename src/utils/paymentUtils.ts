import { PaymentMethod } from '../types';

/** Accept canonical values and migrate payment methods saved by the previous UI. */
export function normalizePaymentMethod(value: unknown): PaymentMethod | undefined {
  switch (value) {
    case 'online_gateway': return 'online';
    case 'cash_deposit': return 'bank_receipt';
    case 'pos':
    case 'bank_receipt':
    case 'card_to_card':
    case 'cheque':
    case 'online':
    case 'cash': return value;
    default: return undefined;
  }
}
