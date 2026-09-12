import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { RoleQuickSwitch } from './components/RoleQuickSwitch';
import { NotificationToast } from './components/NotificationToast';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PlatformAdminDashboard } from './components/PlatformAdminDashboard';
import { PrincipalDashboard } from './components/PrincipalDashboard';
import { VicePrincipalDashboard } from './components/VicePrincipalDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { QuestionBankModal } from './components/QuestionBankModal';
import { GraduationCap, ShieldCheck, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentRole } = useApp();
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);

  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'platform_admin':
        return <PlatformAdminDashboard onOpenQuestionBank={() => setIsQuestionBankOpen(true)} />;
      case 'principal':
        return <PrincipalDashboard onOpenQuestionBank={() => setIsQuestionBankOpen(true)} />;
      case 'vice_principal':
        return <VicePrincipalDashboard />;
      case 'teacher':
        return <TeacherDashboard onOpenQuestionBank={() => setIsQuestionBankOpen(true)} />;
      case 'student':
        return <StudentDashboard onOpenQuestionBank={() => setIsQuestionBankOpen(true)} />;
      case 'parent':
        return <ParentDashboard />;
      default:
        return <TeacherDashboard onOpenQuestionBank={() => setIsQuestionBankOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800" dir="rtl">
      {/* Top Header */}
      <Header />

      {/* Role Quick Switcher bar */}
      <RoleQuickSwitch />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderDashboardByRole()}
      </main>

      {/* Question Bank Modal */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
      />

      {/* Floating System Toasts */}
      <NotificationToast />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800">
              سامانه هوشمند قطب مدارس شهرستان
            </span>
            <span>— پلتفرم جامع مدیریت یکپارچه آموزشی</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>طراحی متناسب با نیازهای بومی مدارس ایران</span>
            <span>•</span>
            <span>سازگار با پیام‌رسان بله و سامانه پیام کوتاه</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
