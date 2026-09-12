import React, { useState, useRef } from 'react';
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
  FileText,
  UploadCloud,
  CheckCircle2,
  FileSpreadsheet,
  Pin,
  PinOff,
  Edit3
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
  const {
    announcements,
    currentSchoolId,
    currentUser,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | PostType>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Announcement | null>(null);

  // Form states
  const [postType, setPostType] = useState<PostType>('announcement');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState<'all' | 'teachers' | 'parents' | 'students'>('all');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  
  // Real Uploaded File State
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
    type: 'image' | 'video' | 'file';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPosts = announcements
    .filter((a) => (activeFilter === 'all' ? true : a.type === activeFilter))
    .sort((a, b) => {
      // Pinned posts always appear at the top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const handleStartEdit = (post: Announcement) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setPostType(post.type);
    setTarget(post.target || 'all');
    setPriority(post.priority || 'normal');
    setUploadedFile(null);
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setEditingPost(null);
    setTitle('');
    setContent('');
    setUploadedFile(null);
    setShowAddForm(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFile({
        name: file.name,
        size: `${toPersianDigits(sizeInMb)} مگابایت`,
        dataUrl: reader.result as string,
        type: isImg ? 'image' : isVid ? 'video' : 'file'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const attachments: PostAttachment[] = uploadedFile
      ? [
          {
            name: uploadedFile.name,
            type: uploadedFile.type,
            caption: `پیوست رسمی (${uploadedFile.size})`,
            url: uploadedFile.dataUrl
          }
        ]
      : [];

    if (editingPost) {
      updateAnnouncement(editingPost.id, {
        type: postType,
        title: title.trim(),
        content: content.trim(),
        target,
        priority,
        ...(uploadedFile
          ? {
              coverImage: uploadedFile.type === 'image' ? uploadedFile.dataUrl : editingPost.coverImage,
              attachments: attachments.length > 0 ? attachments : editingPost.attachments
            }
          : {})
      });
    } else {
      addAnnouncement({
        schoolId: currentSchoolId,
        type: postType,
        title: title.trim(),
        content: content.trim(),
        senderRole: currentUser.roleTitle,
        senderName: currentUser.name,
        target,
        priority,
        coverImage: uploadedFile && uploadedFile.type === 'image' ? uploadedFile.dataUrl : undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      });
    }

    handleCancelForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">سامانه اطلاع‌رسانی، اخبار و گزارش رویدادها</h3>
              <p className="text-xs text-slate-400">انتشار با امکان آپلود مستقیم فایل و پوستر رویداد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Add Action */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0">
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
              اخبار
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
              گزارش‌ها
            </button>
          </div>

          {canPublish && (
            <button
              onClick={() => {
                if (showAddForm && !editingPost) {
                  setShowAddForm(false);
                } else {
                  handleCancelForm();
                  setShowAddForm(true);
                }
              }}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>مطلب جدید</span>
            </button>
          )}
        </div>

        {/* Scrollable Container (Smooth scrolling on mobile and desktop) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50">
          {/* Add / Edit Post Form */}
          {showAddForm && canPublish && (
            <form
              onSubmit={handleSubmit}
              className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-teal-500/40 shadow-md space-y-3.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  {editingPost ? (
                    <>
                      <Edit3 className="w-4 h-4 text-teal-600" />
                      <span>ویرایش اطلاعیه یا خبر</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-teal-600" />
                      <span>انتشار مطلب یا رویداد جدید</span>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-slate-400 hover:text-slate-700 text-xs"
                >
                  انصراف
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">دسته‌بندی مطلب:</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as PostType)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری / بااهمیت</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">عنوان مطلب:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: برگزاری جشن تقدیر از برگزیدگان مسابقات علمی"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">متن کامل اطلاعیه / شرح رویداد:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="متن پیام، زمان دقیق، اهداف و دستاوردهای رویداد..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* REAL FILE & IMAGE UPLOAD ZONE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-teal-600" />
                  <span>آپلود مستقیم تصویر، پوستر یا فایل ضمیمه (PDF / عکس):</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,video/*"
                  className="hidden"
                  id="post-file-upload"
                />

                {!uploadedFile ? (
                  <label
                    htmlFor="post-file-upload"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/40 rounded-2xl cursor-pointer transition-colors text-center group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-200 group-hover:bg-teal-100 text-slate-600 group-hover:text-teal-700 flex items-center justify-center mb-1 transition-colors">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      کلیک کنید یا فایل را اینجا رها کنید
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      تصاویر JPG/PNG، فایل‌های بخشنامه PDF یا ویدیوهای گزارش
                    </span>
                  </label>
                ) : (
                  <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {uploadedFile.type === 'image' ? (
                        <img
                          src={uploadedFile.dataUrl}
                          alt="preview"
                          className="w-12 h-12 rounded-xl object-cover border border-teal-300 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="text-right truncate text-xs">
                        <span className="font-bold text-slate-900 block truncate">
                          {uploadedFile.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {uploadedFile.size} • آماده انتشار
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="حذف فایل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {editingPost ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ذخیره تغییرات اطلاعیه</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>انتشار رسمی مطلب</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
                  post.isPinned
                    ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20'
                    : 'border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {post.isPinned && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-amber-600 text-amber-600" />
                        <span>سنجاق‌شده به بالا</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        post.type === 'announcement'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : post.type === 'news'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : post.type === 'event'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {post.type === 'announcement'
                        ? 'اطلاعیه رسمی'
                        : post.type === 'news'
                        ? 'خبر مدرسه'
                        : post.type === 'event'
                        ? 'رویداد'
                        : 'گزارش رویداد'}
                    </span>
                    {post.priority === 'urgent' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        فوری
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      {toPersianDigits(post.date)}
                    </span>
                  </div>

                  {canPublish && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePinAnnouncement(post.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          post.isPinned
                            ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        title={post.isPinned ? 'برداشتن پین' : 'پین کردن اطلاعیه به بالای تابلو'}
                      >
                        {post.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleStartEdit(post)}
                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                        title="ویرایش متن اطلاعیه"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteAnnouncement(post.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف مطلب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {post.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Uploaded Cover Image / Poster */}
                {post.coverImage && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {post.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-medium">{att.name}</span>
                        {att.caption && (
                          <span className="text-[10px] text-slate-400">({att.caption})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span>فرستنده: {post.senderName}</span>
                    <span className="text-slate-300">•</span>
                    <span>({post.senderRole})</span>
                  </div>
                  <span>مخاطب: {post.target === 'all' ? 'عمومی' : post.target}</span>
                </div>
              </div>
            ))}

            {filteredPosts.length === 0 && (
              <div className="bg-white p-10 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                مطلبی در این دسته‌بندی وجود ندارد.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
