import React, { useState } from 'react';
import {
  X,
  Bell,
  Newspaper,
  Calendar,
  FileCheck,
  Plus,
  Trash2,
  Send,
  Users,
  Clock,
  Sparkles,
  Image as ImageIcon,
  Video,
  Paperclip,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Announcement, PostType, PostAttachment } from '../types';
import { toPersianDigits } from '../utils/persianUtils';

interface PostManagerModalProps {
  onClose: () => void;
  canPublish?: boolean;
}

export const PostManagerModal: React.FC<PostManagerModalProps> = ({
  onClose,
  canPublish = true
}) => {
  const { announcements, currentSchoolId, currentUser, addAnnouncement, deleteAnnouncement } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | PostType>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [postType, setPostType] = useState<PostType>('announcement');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<'all' | 'teachers' | 'parents' | 'students'>('all');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [coverImage, setCoverImage] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentType, setAttachmentType] = useState<'image' | 'video' | 'file'>('file');

  const filteredPosts = announcements.filter((a) =>
    activeFilter === 'all' ? true : a.type === activeFilter
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const attachments: PostAttachment[] = attachmentName.trim()
      ? [
          {
            name: attachmentName.trim(),
            type: attachmentType,
            caption: 'پیوست رسمی اطلاعیه'
          }
        ]
      : [];

    addAnnouncement({
      schoolId: currentSchoolId,
      type: postType,
      title,
      content,
      senderRole: currentUser.roleTitle,
      senderName: currentUser.name,
      target,
      priority,
      coverImage: coverImage.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    setTitle('');
    setContent('');
    setCoverImage('');
    setAttachmentName('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">سامانه اطلاع‌رسانی، اخبار و گزارش رویدادها</h3>
              <p className="text-xs text-slate-400">انتشار فوری برای اولیا، دانش‌آموزان و کادر آموزشی مدرسه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Add Action */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-teal-800 text-white font-bold'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              همه ({toPersianDigits(announcements.length)})
            </button>
            <button
              onClick={() => setActiveFilter('announcement')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'announcement'
                  ? 'bg-teal-800 text-white font-bold'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              اطلاعیه‌ها
            </button>
            <button
              onClick={() => setActiveFilter('news')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'news'
                  ? 'bg-teal-800 text-white font-bold'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              اخبار مدرسه
            </button>
            <button
              onClick={() => setActiveFilter('event')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'event'
                  ? 'bg-teal-800 text-white font-bold'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              رویدادها
            </button>
            <button
              onClick={() => setActiveFilter('event_report')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'event_report'
                  ? 'bg-teal-800 text-white font-bold'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              گزارش رویدادها
            </button>
          </div>

          {canPublish && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              مطلب جدید
            </button>
          )}
        </div>

        {/* Add Post Form */}
        {showAddForm && canPublish && (
          <form onSubmit={handleSubmit} className="bg-teal-50/60 p-4 border-b border-teal-200 space-y-3 shrink-0">
            <div className="font-bold text-slate-800 text-xs sm:text-sm">انتشار مطلب یا رویداد جدید</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">دسته‌بندی مطلب:</label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as PostType)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="announcement">اطلاعیه رسمی</option>
                  <option value="news">خبر مدرسه</option>
                  <option value="event">رویداد و برنامه آینده</option>
                  <option value="event_report">گزارش و دستاورد رویداد گذشته</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">مخاطبان هدف:</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as any)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="all">همه (عمومی)</option>
                  <option value="parents">فقط اولیا و خانواده‌ها</option>
                  <option value="students">فقط دانش‌آموزان</option>
                  <option value="teachers">فقط کادر آموزشی و دبیران</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">اولویت نمایش:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="normal">عادی</option>
                  <option value="urgent">فوری / بااهمیت</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">عنوان مطلب:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: برگزاری جشن تقدیر از نخبگان مسابقات فیزیک"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">متن کامل اطلاعیه / شرح رویداد:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="متن پیام، زمان دقیق، اهداف و دستاوردهای رویداد..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              {/* Media Attachments Inputs */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  تصویر شاخص یا پوستر خبر (اختیاری):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="آدرس اینترنتی تصویر یا پوستر (URL)"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full text-xs p-2 ps-7 bg-white border border-slate-300 rounded-lg"
                  />
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  نوع فایل ضمیمه:
                </label>
                <select
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value as any)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="file">بخشنامه و فایل PDF</option>
                  <option value="image">عکس و آلبوم گزارش</option>
                  <option value="video">ویدیو و کلیپ گزارش</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  نام فایل یا عنوان فایل ضمیمه (اختیاری):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: bakhshnameh-mosabeghat.pdf یا clip-jashnvareh.mp4"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="w-full text-xs p-2 ps-7 bg-white border border-slate-300 rounded-lg"
                  />
                  <Paperclip className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                انتشار سراسری
              </button>
            </div>
          </form>
        )}

        {/* Posts List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-3">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              const getTypeBadge = () => {
                switch (post.type) {
                  case 'news':
                    return { label: 'خبر', bg: 'bg-blue-100 text-blue-800' };
                  case 'event':
                    return { label: 'رویداد پیش‌رو', bg: 'bg-purple-100 text-purple-800' };
                  case 'event_report':
                    return { label: 'گزارش رویداد', bg: 'bg-emerald-100 text-emerald-800' };
                  default:
                    return { label: 'اطلاعیه', bg: 'bg-amber-100 text-amber-800' };
                }
              };

              const badge = getTypeBadge();

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {post.priority === 'urgent' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                          فوری
                        </span>
                      )}
                      <h4 className="font-bold text-slate-800 text-sm sm:text-base">{post.title}</h4>
                    </div>

                    {canPublish && (
                      <button
                        onClick={() => deleteAnnouncement(post.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                    {post.content}
                  </p>

                  {/* Media Cover Preview */}
                  {post.coverImage && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 max-h-48 bg-slate-100">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Attachments List */}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-3 pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">ضمایم و فایل‌های پیوست:</span>
                      {post.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors border border-slate-200"
                        >
                          {att.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-teal-600" />}
                          {att.type === 'video' && <Video className="w-3.5 h-3.5 text-blue-600" />}
                          {att.type === 'file' && <FileText className="w-3.5 h-3.5 text-amber-600" />}
                          <span className="font-mono text-[11px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 gap-2">
                    <div className="flex items-center gap-3">
                      <span>نویسنده: <strong className="text-slate-600">{post.senderName} ({post.senderRole})</strong></span>
                      <span>مخاطب: <strong className="text-teal-700">
                        {post.target === 'all' ? 'همه کاربران' :
                         post.target === 'parents' ? 'اولیا' :
                         post.target === 'students' ? 'دانش‌آموزان' : 'دبیران'}
                      </strong></span>
                    </div>
                    <span className="font-mono">{toPersianDigits(post.date)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
              مطلبی در این دسته وجود ندارد.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
