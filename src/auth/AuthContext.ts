import {createContext,useContext} from 'react';
import type {UserRole,VicePrincipalPermissions} from '../types';

export interface AuthMembership {id:string;school_id:string|null;school_name?:string;label?:string;role:UserRole;profile_id:string|null;student_id:string|null;permissions:Partial<VicePrincipalPermissions>}
export interface AuthState {user:{id:string;name:string;username:string;phone:string;csrf:string};memberships:AuthMembership[]}
interface AuthContextValue extends AuthState {member:AuthMembership;select:(id:string)=>void;logout:()=>Promise<void>}

// Keep the shared context outside the component module so lazy loading and
// development hot updates always use the same provider/consumer identity.
export const AuthContext=createContext<AuthContextValue|null>(null);
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('Authentication required');return value;}
