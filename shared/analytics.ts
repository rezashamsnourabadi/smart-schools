export type AnalyticsKind='activity'|'banner_impression'|'banner_click'|'dana_plus_open';
export interface AnalyticsEvent {id:string;kind:AnalyticsKind;bannerId?:string}
export interface AnalyticsCounts {users:number;schools:number;impressions:number;viewers:number;clicks:number;clickers:number;danaOpens:number;danaUsers:number}
export interface AnalyticsReport {
 startedAt:string;from:string;to:string;totals:AnalyticsCounts;
 daily:({day:string}&AnalyticsCounts)[];
 roles:{role:string;users:number}[];
 banners:{id:string;title:string;impressions:number;viewers:number;clicks:number;clickers:number;legacyClicks:number}[];
 bannerTotal:number;
 schools:{id:string;name:string;users:number;danaUsers:number}[];schoolTotal:number;
}
