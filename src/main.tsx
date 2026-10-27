import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {AuthShell} from './auth/AuthShell';
import '@fontsource/vazirmatn/arabic-400.css';
import '@fontsource/vazirmatn/arabic-700.css';
import './index.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthShell/>
  </StrictMode>,
);
