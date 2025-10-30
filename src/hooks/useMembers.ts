import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MembersAPI } from '@/lib/members-api'
import { CompanyMember, AddMemberRequest } from '@/types/members'
import toast from 'react-hot-toast'

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: MembersAPI.list,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAddMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: MembersAPI.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member added successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member')
    }
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'member' }) => 
      MembersAPI.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member role updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update member role')
    }
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: MembersAPI.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member removed')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member')
    }
  })
}