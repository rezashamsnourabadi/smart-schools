import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ExternalLink, BookmarkCheck } from 'lucide-react';

interface Props {
  audienceFilter?: 'students' | 'parents' | 'teachers' | 'all';
}

export const SponsorBannerCard: React.FC<Props> = ({ audienceFilter = 'all' }) => {
  const { banners, clickBanner } = useApp();

  const activeBanners = banners.filter(
    (b) => b.isActive && (b.targetAudience.includes('all') || b.targetAudience.includes(audienceFilter as any))
  );

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[0]; // Display the top targeted banner

  return (
    <div
      id={`sponsor-banner-${currentBanner.id}`}
      className="rounded-2xl border border-slate-200 bg-linear-to-r from-slate-50 via-teal-50/30 to-indigo-50/30 p-4 sm:p-5 relative overflow-hidden transition-all shadow-xs hover:border-teal-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                {currentBanner.badge}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <BookmarkCheck className="w-3.5 h-3.5 text-slate-400" />
                حامی فرهنگی و آموزشی: {currentBanner.sponsorName}
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 leading-snug">
              {currentBanner.title}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {currentBanner.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end shrink-0">
          <button
            id={`banner-action-btn-${currentBanner.id}`}
            onClick={() => clickBanner(currentBanner.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
          >
            <span>{currentBanner.linkText}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
