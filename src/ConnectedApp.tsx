import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider,type AuthState} from './auth/AuthProvider';
import App from './App';
const client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false,gcTime:5*60*1000},mutations:{retry:false}}});
export default function ConnectedApp({initialSession}:{initialSession:AuthState}){return <QueryClientProvider client={client}><AuthProvider initialSession={initialSession}><App/></AuthProvider></QueryClientProvider>;}
