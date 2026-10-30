export const schoolModes=['active','read_only','suspended'] as const;
export type SchoolMode=(typeof schoolModes)[number];
export interface SchoolAccess {schoolId:string|null;schoolName:string;mode:SchoolMode;configuredMode:SchoolMode;reason:string;expiresAt:string|null;version:number;updatedAt:string|null}
export const ticketStates=['new','in_progress','waiting_user','resolved','closed'] as const;
export type TicketState=(typeof ticketStates)[number];
export const ticketCategories=['technical','education','finance','access'] as const;
export const ticketPriorities=['normal','high'] as const;
export interface SupportTicket {assignedTo:string|null;assignedName:string|null;id:string;schoolId:string;schoolName:string;ownerName:string;ownerId:string;title:string;category:(typeof ticketCategories)[number];priority:(typeof ticketPriorities)[number];status:TicketState;version:number;createdAt:string;updatedAt:string}
export interface TicketReply {id:string;authorName:string;isStaff:boolean;message:string;createdAt:string}

export interface SupportAttachment {id:string;name:string;mime:string;size:number;createdAt:string;authorName:string}
