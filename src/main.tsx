import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {LandingPage} from './components/LandingPage';
import {Status} from './auth/Status';
import '@fontsource/vazirmatn/arabic-400.css';
import '@fontsource/vazirmatn/arabic-700.css';
import './index.css';

const AuthShell=lazy(()=>import('./auth/AuthShell').then(module=>({default:module.AuthShell})));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname==='/' ? <LandingPage/> : <Suspense fallback={<Status text="در حال بارگذاری…"/>}><AuthShell/></Suspense>}
  </StrictMode>,
);
