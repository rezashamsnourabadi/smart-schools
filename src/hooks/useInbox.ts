import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../auth/AuthContext';
import {request} from '../api/client';
import type {InboxSummary} from '../../shared/inbox';
export function useInboxSummary(){const auth=useAuth();return useQuery({queryKey:['inbox',auth.member.id,'summary'],queryFn:({signal})=>request<InboxSummary>('/inbox/summary',{signal,scope:{membershipId:auth.member.id,csrf:auth.user.csrf}}),refetchInterval:30000,staleTime:10000,retry:false});}
