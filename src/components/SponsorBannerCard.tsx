import {useAnalytics} from '../analytics/AnalyticsProvider';
import {useBannerImpression} from '../analytics/useBannerImpression';
import React, {useId} from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ExternalLink, BookmarkCheck } from 'lucide-react';
import {safeExternalUrl} from '../utils/externalLinks';

function BannerLink({id,className,url,label,onClick,children,elementRef}:{elementRef:(node:HTMLElement|null)=>void;id:string;className:string;url?:string;label:string;onClick:()=>void;children:React.ReactNode}) {
  return url?<a ref={elementRef} id={id} href={url} target="_blank" rel="noopener noreferrer sponsored" aria-label={label} onClick={onClick} className={`${className} block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700`}>{children}</a>:<div ref={elementRef} id={id} className={className}>{children}</div>;
}

interface Props {
  audienceFilter?: 'students' | 'parents' | 'teachers' | 'all';
  variant?: 'compact' | 'full';
}

export const SponsorBannerCard: React.FC<Props> = ({
  audienceFilter = 'all',
  variant = 'compact'
}) => {
  const { banners } = useApp(),track=useAnalytics();
  const instanceId=useId();

  const activeBanners = banners.filter(
    (b) => b.isActive && (b.targetAudience.includes('all') || b.targetAudience.includes(audienceFilter))
  );

  const currentBanner = activeBanners[0],impression=useBannerImpression(currentBanner?.id,variant);
  if(!currentBanner)return null;
  const linkUrl=safeExternalUrl(currentBanner.linkUrl);
  const recordClick=()=>{track('banner_click',currentBanner.id);};
  const linkLabel=`${currentBanner.title}، ${currentBanner.linkText} (در تب جدید)`;

  if (variant === 'compact') {
    return (
      <BannerLink
        id={`sponsor-banner-compact-${currentBanner.id}-${instanceId}`}
        elementRef={node=>{impression.current=node;}} url={linkUrl} label={linkLabel} onClick={recordClick}
        className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-indigo-500/10 border border-teal-200/80 p-3 sm:p-3.5 shadow-2xs hover:border-teal-300 transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-right min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                  {currentBanner.badge}
                </span>
                <span className="text-xs font-bold text-slate-900 leading-snug">
                  {currentBanner.title}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                حامی فرهنگی و آموزشی: {currentBanner.sponsorName}
              </span>
            </div>
          </div>

          {linkUrl&&<span
            id={`banner-action-btn-${currentBanner.id}-${instanceId}`}
            className="min-h-11 self-end sm:self-center shrink-0 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
          >
            <span>{currentBanner.linkText}</span>
            <ExternalLink className="w-3 h-3" />
          </span>}
        </div>
      </BannerLink>
    );
  }

  return (
    <BannerLink
      id={`sponsor-banner-${currentBanner.id}-${instanceId}`}
      elementRef={node=>{impression.current=node;}} url={linkUrl} label={linkLabel} onClick={recordClick}
      className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-teal-50/30 to-indigo-50/30 p-4 sm:p-5 relative overflow-hidden transition-all shadow-xs hover:border-teal-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="space-y-1 text-right min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                {currentBanner.badge}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1">
                <BookmarkCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>حامی: {currentBanner.sponsorName}</span>
              </span>
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
              {currentBanner.title}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentBanner.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end shrink-0 pt-1 sm:pt-0">
          {linkUrl&&<span
            id={`banner-action-btn-${currentBanner.id}-${instanceId}`}
            className="min-h-11 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <span>{currentBanner.linkText}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </span>}
        </div>
      </div>
    </BannerLink>
  );
};
