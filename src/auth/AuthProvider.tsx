import React,{createContext,useContext,useState,useEffect} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {request,RequestError} from '../api/client';
import type {UserRole,VicePrincipalPermissions} from '../types';
import {LoginPage} from './LoginPage';
import {Status} from './Status';
import {requestedDashboardRole,showDashboardPath,showLoginPath} from './navigation';
export {Status} from './Status';

export interface AuthMembership {id:string;school_id:string|null;school_name?:string;label?:string;role:UserRole;profile_id:string|null;student_id:string|null;permissions:Partial<VicePrincipalPermissions>}
export interface AuthState {user:{id:string;name:string;username:string;phone:string;csrf:string};memberships:AuthMembership[]}
interface AuthContextValue extends AuthState {member:AuthMembership;select:(id:string)=>void;logout:()=>Promise<void>}
const Context=createContext<AuthContextValue|null>(null);
export function AuthProvider({children,initialSession}:{children:React.ReactNode;initialSession?:AuthState}) {
  const client=useQueryClient();const [selected,setSelected]=useState(()=>initialSession?.memberships.find(member=>member.role===requestedDashboardRole())?.id||'');
  const auth=useQuery({queryKey:['auth'],queryFn:({signal})=>request<AuthState>('/auth/me',{signal}),retry:false,staleTime:60000,initialData:initialSession});
  useEffect(()=>{const ended=()=>{void client.cancelQueries();client.removeQueries({predicate:q=>q.queryKey[0]!=='auth'});client.setQueryData(['auth'],null);setSelected('');};window.addEventListener('school-session-ended',ended);return()=>window.removeEventListener('school-session-ended',ended);},[client]);
  useEffect(()=>{
    if(auth.isPending)return;
    if((auth.error instanceof RequestError&&auth.error.status===401)||(!auth.error&&!auth.data)){showLoginPath();return;}
    const member=auth.data?.memberships.find(member=>member.id===selected)||auth.data?.memberships[0];
    if(member)showDashboardPath(member.role);
  },[auth.isPending,auth.data,auth.error,selected]);
  if(auth.isPending)return <Status text="در حال بررسی ورود…"/>;
  if(auth.error) {
    if(auth.error instanceof RequestError&&auth.error.status===401)return <LoginPage onSuccess={()=>{void client.invalidateQueries({queryKey:['auth']});}}/>;
    return <Status text={auth.error.message} onRetry={()=>void auth.refetch()}/>;
  }
  if(!auth.data)return <LoginPage onSuccess={()=>{void client.invalidateQueries({queryKey:['auth']});}}/>;
  const state=auth.data!;const member=state.memberships.find(m=>m.id===selected)||state.memberships[0];
  if(!member)return <Status text="برای این حساب دسترسی فعالی ثبت نشده است."/>;
  const select=(id:string)=>{
    if(!state.memberships.some(m=>m.id===id))return;
    void client.cancelQueries({predicate:q=>q.queryKey[0]!=='auth'});
    client.removeQueries({predicate:q=>q.queryKey[0]!=='auth'});setSelected(id);
  };
  const logout=async()=>{await request('/auth/logout',{method:'POST',body:{},scope:{membershipId:member.id,csrf:state.user.csrf}});await client.cancelQueries();client.removeQueries({predicate:q=>q.queryKey[0]!=='auth'});client.setQueryData(['auth'],null);setSelected('');};
  return <Context.Provider value={{...state,member,select,logout}}><React.Fragment key={member.id}>{children}</React.Fragment></Context.Provider>;
}
export function useAuth(){const value=useContext(Context);if(!value)throw new Error('Authentication required');return value;}
