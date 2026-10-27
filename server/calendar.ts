import {getSchoolDate,toEnglishDigits} from '../src/utils/persianUtils';
import {requireValue} from './errors';

/** Resolve a civil Solar Hijri day to a Gregorian SQL DATE without timezone guessing. */
export function civilDate(value:string):string {
  const normalized=toEnglishDigits(value).trim();
  const parts=normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  requireValue(parts,'تاریخ باید به صورت سال/ماه/روز شمسی باشد.');
  const year=Number(parts[1]),month=Number(parts[2]),day=Number(parts[3]);
  requireValue(year>=1200&&year<=1600&&month>=1&&month<=12&&day>=1&&day<=31,'تاریخ خارج از محدوده معتبر است.');
  const target=`${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
  let low=Math.floor(Date.UTC(year+621,0,1)/86400000),high=Math.floor(Date.UTC(year+622,11,31)/86400000);
  while(low<=high){const middle=Math.floor((low+high)/2);const instant=new Date(middle*86400000+12*3600000);const actual=getSchoolDate(instant);if(actual===target)return instant.toISOString().slice(0,10);if(actual<target)low=middle+1;else high=middle-1;}
  requireValue(false,'روز انتخاب‌شده در تقویم شمسی وجود ندارد.');
}
export function validateCivilDates(data:Record<string,unknown>) {
  for(const key of ['date','birthDate','assignedDate','dueDate','examDate','startDate','endDate'])if(typeof data[key]==='string'&&data[key]){civilDate(data[key]);const parts=toEnglishDigits(data[key]).split('/');data[key]=`${parts[0]}/${parts[1].padStart(2,'0')}/${parts[2].padStart(2,'0')}`;}
  if(Array.isArray(data.terms))for(const term of data.terms)validateCivilDates(term as Record<string,unknown>);
}
