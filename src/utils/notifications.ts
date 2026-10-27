import type {NotificationLog} from '../types';
export function notificationStatusLabel(status:NotificationLog['status']):string{return {simulated:'سابقه آزمایشی قدیمی',queued:'در صف ارسال',sent:'ارسال‌شده',delivered:'تحویل‌شده',unavailable:'سرویس ارسال تنظیم نشده',failed:'ارسال ناموفق'}[status];}
