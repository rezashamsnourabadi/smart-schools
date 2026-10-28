import React, { useState, lazy, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { RoleQuickSwitch } from './components/RoleQuickSwitch';
import { NotificationToast } from './components/NotificationToast';
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(module => ({ default: module.TeacherDashboard })));
const PlatformAdminDashboard = lazy(() => import('./components/PlatformAdminDashboard').then(module => ({ default: module.PlatformAdminDashboard })));
const PrincipalDashboard = lazy(() => import('./components/PrincipalDashboard').then(module => ({ default: module.PrincipalDashboard })));
const VicePrincipalDashboard = lazy(() => import('./components/VicePrincipalDashboard').then(module => ({ default: module.VicePrincipalDashboard })));
const StudentDashboard = lazy(() => import('./components/StudentDashboard').then(module => ({ default: module.StudentDashboard })));
const ParentDashboard = lazy(() => import('./components/ParentDashboard').then(module => ({ default: module.ParentDashboard })));
const QuestionBankModal = lazy(() => import('./components/QuestionBankModal').then(module => ({ default: module.QuestionBankModal })));
const StudentDossierModal = lazy(() => import('./components/StudentDossierModal').then(module => ({ default: module.StudentDossierModal })));
const SchedulePlannerModal = lazy(() => import('./components/SchedulePlannerModal').then(module => ({ default: module.SchedulePlannerModal })));
const ClassManagerModal = lazy(() => import('./components/ClassManagerModal').then(module => ({ default: module.ClassManagerModal })));
const StudentManagerModal = lazy(() => import('./components/StudentManagerModal').then(module => ({ default: module.StudentManagerModal })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(module => ({ default: module.UserProfileModal })));
const PostManagerModal = lazy(() => import('./components/PostManagerModal').then(module => ({ default: module.PostManagerModal })));
const StaffManagerModal = lazy(() => import('./components/StaffManagerModal').then(module => ({ default: module.StaffManagerModal })));
const VicePrincipalPermissionsModal = lazy(() => import('./components/VicePrincipalPermissionsModal').then(module => ({ default: module.VicePrincipalPermissionsModal })));
const TeacherGradeEntryModal = lazy(() => import('./components/TeacherGradeEntryModal').then(module => ({ default: module.TeacherGradeEntryModal })));
const TeacherHomeworkAndExamModal = lazy(() => import('./components/TeacherHomeworkAndExamModal').then(module => ({ default: module.TeacherHomeworkAndExamModal })));
const AcademicYearManagerModal = lazy(() => import('./components/AcademicYearManagerModal').then(module => ({ default: module.AcademicYearManagerModal })));
const FinanceManagerModal = lazy(() => import('./components/FinanceManagerModal').then(module => ({ default: module.FinanceManagerModal })));
const SystemDocsModal = lazy(() => import('./components/SystemDocsModal').then(module => ({ default: module.SystemDocsModal })));
import { MobileBottomNav } from './components/MobileBottomNav';
import { GraduationCap, BookOpen } from 'lucide-react';
import { Student } from './types';

const AppContent: React.FC = () => {
  const {
    currentRole,
    currentStudent,
    selectedStudentForDossier,
    setSelectedStudentForDossier,
    dossierInitialTab,
    openStudentDossier,
    canManageSchool
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
  const [isAcademicYearModalOpen, setIsAcademicYearModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

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
            onOpenAcademicYearModal={() => setIsAcademicYearModalOpen(true)}
            onOpenFinanceModal={() => setIsFinanceModalOpen(true)}
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
            onOpenFinanceModal={() => setIsFinanceModalOpen(true)}
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
            onOpenStudentDossier={(student,tab)=>openStudentDossier(student,tab)}
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
    <div className={`min-h-screen w-full max-w-full overflow-x-clip flex flex-col text-slate-800 antialiased selection:bg-teal-200 ${currentRole==='student'?'bg-[#f7f8f4]':'bg-slate-100/70'}`} dir="rtl">
      {/* Top Header with Profile Modal trigger and Brand Switcher */}
      <Header
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenDocsModal={() => setIsDocsModalOpen(true)}
      />

      {/* Role Quick Switcher bar */}
      <RoleQuickSwitch />

      {/* Main Content Area (extra bottom padding for mobile navigation bar, compact for landscape) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 md:pb-6 overflow-x-clip">
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
          if (currentStudent) {
            if(currentRole==='student')openStudentDossier(currentStudent,'profile');
            else setSelectedStudentForDossier(currentStudent);
          }
        }}
      />

      {/* Full Student Dossier Modal */}
      <AnimatePresence>{selectedStudentForDossier && (currentRole !== 'vice_principal' || canManageSchool('canViewFullDossier')) && (
        <StudentDossierModal
          key={selectedStudentForDossier.id}
          student={selectedStudentForDossier}
          onClose={() => setSelectedStudentForDossier(null)}
          canEditContact={currentRole === 'parent' || canManageSchool('canManageStudentsAndClasses')}
          canManageDiscipline={canManageSchool('canLogDisciplinary')}
          initialTab={dossierInitialTab}
        />
      )}</AnimatePresence>

      {/* Dedicated Student Manager Modal */}
      {isStudentModalOpen && canManageSchool('canManageStudentsAndClasses') && (
        <StudentManagerModal
          onClose={() => setIsStudentModalOpen(false)}
          onOpenDossier={(student) => setSelectedStudentForDossier(student)}
        />
      )}

      {/* Dedicated Class Manager Modal */}
      {isClassModalOpen && canManageSchool('canManageStudentsAndClasses') && (
        <ClassManagerModal
          onClose={() => setIsClassModalOpen(false)}
        />
      )}

      {/* User Profile & Contact Settings Modal */}
      <AnimatePresence>{isProfileModalOpen && (
        <UserProfileModal
          key="user-profile-modal"
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}</AnimatePresence>

      {/* Weekly Schedule Planner Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && canManageSchool('canManageSchedule') && <SchedulePlannerModal
          key="schedule-planner"
          onClose={() => setIsScheduleModalOpen(false)}
        />}
      </AnimatePresence>

      {/* Post and announcement manager with local browser attachments */}
      <AnimatePresence>
        {isPostModalOpen && canManageSchool('canManageAnnouncements') && <PostManagerModal
          key="post-manager"
          onClose={() => setIsPostModalOpen(false)}
        />}
      </AnimatePresence>

      {/* Comprehensive Staff Manager Modal (Vice Principals & Teachers) */}
      {isVpPermsModalOpen && currentRole === 'principal' && (
        <StaffManagerModal
          onClose={() => setIsVpPermsModalOpen(false)}
        />
      )}

      {/* Teacher Gradebook & Exam Scoring Modal */}
      {isGradeModalOpen && currentRole === 'teacher' && (
        <TeacherGradeEntryModal
          onClose={() => setIsGradeModalOpen(false)}
        />
      )}

      {/* Homework manager and exam schedule planner */}
      <AnimatePresence>
        {isHomeworkExamModalOpen && currentRole === 'teacher' && <TeacherHomeworkAndExamModal
          key="teacher-homework-exam"
          onClose={() => setIsHomeworkExamModalOpen(false)}
        />}
      </AnimatePresence>

      {/* Regional Question Bank Modal */}
      {isQuestionBankOpen && <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
      />}

      {/* Academic Year Management Modal */}
      {isAcademicYearModalOpen && <AcademicYearManagerModal
        isOpen={isAcademicYearModalOpen && currentRole === 'principal'}
        onClose={() => setIsAcademicYearModalOpen(false)}
      />}

      {/* School Financial & Tuition Management Modal */}
      {isFinanceModalOpen && <FinanceManagerModal
        isOpen={isFinanceModalOpen && canManageSchool('canManageFinances')}
        onClose={() => setIsFinanceModalOpen(false)}
      />}

      {/* System Docs & Feature Catalog Modal */}
      {isDocsModalOpen && <SystemDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />}

      {/* Floating notifications for local simulated events */}
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

          <div className="flex items-center gap-4 text-slate-500">
            <button
              id="footer-open-docs-btn"
              onClick={() => setIsDocsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 transition-colors font-bold text-xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>مستندات و کاتالوگ جامع امکانات</span>
            </button>
            <span className="text-slate-300">•</span>
            <span>سامانه مدیریت مدارس — اطلاعات متصل به سرور</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AppWorkspace = () => {
  const { currentRole, currentSchoolId, activeVicePrincipalId } = useApp();
  return <AppContent key={`${currentRole}:${currentSchoolId}:${activeVicePrincipalId}`} />;
};

export default function App() {
  return (
    <AppProvider>
      <Suspense fallback={<p role="status" className="p-6 text-center text-slate-600">در حال بارگذاری بخش موردنظر…</p>}><AppWorkspace /></Suspense>
    </AppProvider>
  );
}
