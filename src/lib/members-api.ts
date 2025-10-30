import { CompanyMember, AddMemberRequest } from '@/types/members'
import { apiClient } from '@/lib/api-client'

export const MembersAPI = {
  async list(): Promise<CompanyMember[]> {
    return apiClient.get<CompanyMember[]>('/members/')
  },

  async add(data: AddMemberRequest): Promise<CompanyMember> {
    return apiClient.post<CompanyMember>('/members/', data)
  },
  
  async updateRole(userId: string, role: 'admin' | 'member'): Promise<CompanyMember> {
    return apiClient.put<CompanyMember>(`/members/${userId}/role`, { role })
  },
  
  async remove(userId: string): Promise<void> {
    return apiClient.delete<void>(`/members/${userId}`)
  },
}