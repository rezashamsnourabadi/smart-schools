export interface MessageRecipient {membershipId:string;userId:string;name:string;username:string;role:string;schoolId:string|null;schoolName:string;studentId:string|null;studentName:string|null}
export interface InboxItem {id:string;title:string;body:string;kind:'direct'|'support'|'announcement';referenceId:string|null;senderName:string;schoolName:string|null;createdAt:string;readAt:string|null;smsStatus:'not_requested'|'queued'|'sent'|'unavailable'|'failed';baleStatus:'not_requested'|'queued'|'sent'|'unavailable'|'failed'}
export interface InboxSummary {unread:number;latestId:string|null}
export interface MessageOptions {sms:boolean;bale:boolean;maxRecipients:number}
