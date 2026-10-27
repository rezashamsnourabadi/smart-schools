import type {UserRole} from '../types';

const dashboardRoles: UserRole[] = ['platform_admin','principal','vice_principal','teacher','student','parent'];
const roleTitles: Record<UserRole,string> = {platform_admin:'مدیر پلتفرم',principal:'مدیر مدرسه',vice_principal:'معاون',teacher:'دبیر',student:'دانش‌آموز',parent:'والد'};

export function requestedDashboardRole(): UserRole | undefined {
  return dashboardRoles.find(role => window.location.pathname === `/dashboard/${role}`);
}

export function showLoginPath() {
  if(window.location.pathname !== '/login')window.history.replaceState(null,'','/login');
  document.title='ورود به سامانه | دانا';
}

export function showDashboardPath(role: UserRole) {
  const path=`/dashboard/${role}`;
  if(window.location.pathname !== path)window.history.replaceState(null,'',path);
  document.title=`داشبورد ${roleTitles[role]} | دانا`;
}
