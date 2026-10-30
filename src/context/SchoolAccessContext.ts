import {createContext,useContext} from 'react';
import type {SchoolAccess} from '../../shared/operations';
export const SchoolAccessContext=createContext<SchoolAccess|null>(null);
export const useSchoolAccess=()=>useContext(SchoolAccessContext);
