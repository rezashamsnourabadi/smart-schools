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
import { StudentDossierModal } from './components/StudentDossierModal';
import { SchedulePlannerModal } from './components/SchedulePlannerModal';
import { ClassManagerModal } from './components/ClassManagerModal';
import { StudentManagerModal } from './components/StudentManagerModal';
import { UserProfileModal } from './components/UserProfileModal';
import { PostManagerModal } from './components/PostManagerModal';
import { VicePrincipalPermissionsModal } from './components/VicePrincipalPermissionsModal';
import { TeacherGradeEntryModal } from './components/TeacherGradeEntryModal';
import { TeacherHomeworkAndExamModal } from './components/TeacherHomeworkAndExamModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GraduationCap } from 'lucide-react';
import { Student } from './types';

const AppContent: React.FC = () => {
  const {
    currentRole,
    students,
    selectedStudentForDossier,
    setSelectedStudentForDossier,
    vicePrincipalPermissions
  } = useApp();

  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isVpPermsModalOpen, setIsVpPermsModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isHomeworkExamModalOpen, setIsHomeworkExamModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenStudentDossier = (student: Student) => {
    setSelectedStudentForDossier(student);
  };

  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'platform_admin':
        return <PlatformAdminDashboard onOpenQuestionBank={() => setIsQuestionBankOpen(true)} />;
      case 'principal':
        return (
          <PrincipalDashboard
            onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onOpenClassModal={() => setIsClassModalOpen(true)}
            onOpenStudentModal={() => setIsStudentModalOpen(true)}
            onOpenPostModal={() => setIsPostModalOpen(true)}
            onOpenVpPermsModal={() => setIsVpPermsModalOpen(true)}
            onOpenStudentDossier={handleOpenStudentDossier}
          />
        );
      case 'vice_principal':
        return (
          <VicePrincipalDashboard
            onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onOpenClassModal={() => setIsClassModalOpen(true)}
            onOpenStudentModal={() => setIsStudentModalOpen(true)}
            onOpenPostModal={() => setIsPostModalOpen(true)}
            onOpenStudentDossier={handleOpenStudentDossier}
          />
        );
      case 'teacher':
        return (
          <TeacherDashboard
            onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
            onOpenGradeEntryModal={() => setIsGradeModalOpen(true)}
            onOpenHomeworkExamModal={() => setIsHomeworkExamModalOpen(true)}
            onOpenStudentDossier={handleOpenStudentDossier}
          />
        );
      case 'student':
        return (
          <StudentDashboard
            onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
            onOpenStudentDossier={handleOpenStudentDossier}
          />
        );
      case 'parent':
        return (
          <ParentDashboard
            onOpenStudentDossier={handleOpenStudentDossier}
          />
        );
      default:
        return (
          <TeacherDashboard
            onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
            onOpenGradeEntryModal={() => setIsGradeModalOpen(true)}
            onOpenHomeworkExamModal={() => setIsHomeworkExamModalOpen(true)}
            onOpenStudentDossier={handleOpenStudentDossier}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800 antialiased selection:bg-teal-200" dir="rtl">
      {/* Top Header with Profile Modal trigger and Brand Switcher */}
      <Header onOpenProfileModal={() => setIsProfileModalOpen(true)} />

      {/* Role Quick Switcher bar */}
      <RoleQuickSwitch />

      {/* Main Content Area (extra bottom padding for mobile navigation bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
        {renderDashboardByRole()}
      </main>

      {/* Mobile Bottom Navigation for Quick Access on Smartphones */}
      <MobileBottomNav
        onOpenStudents={() => setIsStudentModalOpen(true)}
        onOpenClasses={() => setIsClassModalOpen(true)}
        onOpenSchedule={() => setIsScheduleModalOpen(true)}
        onOpenPosts={() => setIsPostModalOpen(true)}
        onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
        onOpenGrades={() => setIsGradeModalOpen(true)}
        onOpenHomework={() => setIsHomeworkExamModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenDossier={() => {
          const s = students[0];
          if (s) setSelectedStudentForDossier(s);
        }}
      />

      {/* Full Student Dossier Modal */}
      {selectedStudentForDossier && (
        <StudentDossierModal
          student={selectedStudentForDossier}
          onClose={() => setSelectedStudentForDossier(null)}
          canEditContact={currentRole === 'parent'}
          canManageDiscipline={
            currentRole === 'principal' ||
            (currentRole === 'vice_principal' && vicePrincipalPermissions.canManageDiscipline)
          }
        />
      )}

      {/* Dedicated Student Manager Modal */}
      {isStudentModalOpen && (
        <StudentManagerModal
          onClose={() => setIsStudentModalOpen(false)}
          onOpenDossier={(student) => setSelectedStudentForDossier(student)}
        />
      )}

      {/* Dedicated Class Manager Modal */}
      {isClassModalOpen && (
        <ClassManagerModal
          onClose={() => setIsClassModalOpen(false)}
        />
      )}

      {/* User Profile & Contact Settings Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {/* Weekly Schedule Planner Modal */}
      {isScheduleModalOpen && (
        <SchedulePlannerModal
          onClose={() => setIsScheduleModalOpen(false)}
        />
      )}

      {/* Post, News & Event Manager Modal with Direct File/Poster Upload */}
      {isPostModalOpen && (
        <PostManagerModal
          onClose={() => setIsPostModalOpen(false)}
        />
      )}

      {/* Vice Principal Permissions Settings Modal */}
      {isVpPermsModalOpen && (
        <VicePrincipalPermissionsModal
          onClose={() => setIsVpPermsModalOpen(false)}
        />
      )}

      {/* Teacher Gradebook & Exam Scoring Modal */}
      {isGradeModalOpen && (
        <TeacherGradeEntryModal
          onClose={() => setIsGradeModalOpen(false)}
        />
      )}

      {/* Homework & Online Exam Planner Modal */}
      {isHomeworkExamModalOpen && (
        <TeacherHomeworkAndExamModal
          onClose={() => setIsHomeworkExamModalOpen(false)}
        />
      )}

      {/* Regional Question Bank Modal */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
      />

      {/* Floating System Toasts (Bale / SMS delivery) */}
      <NotificationToast />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800">
              سامانه هوشمند مدیریت مدارس
            </span>
            <span>— پلتفرم یکپارچه آموزشی، انضباطی و ارتباطی مدارس</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>طراحی متناسب با نیازهای بومی مدارس ایران و بستر تلفن همراه</span>
            <span>•</span>
            <span>اتصال خودکار به پیام‌رسان بله و سامانه پیامک ملی</span>
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
