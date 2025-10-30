export interface CompanyMember {
  id: string
  user_id: string
  company_id: string
  email: string
  name: string | null
  role: 'admin' | 'member'
  user_role: 'super_admin' | 'company_admin' | 'company_member'
  added_by: string | null
  added_at: string
  created_at: string
  is_owner: boolean
}

export interface AddMemberRequest {
  email: string
  name: string
  phone: string
  role: 'admin' | 'member'
  password?: string  // Optional password for email/password auth
}

export interface UpdateMemberRoleRequest {
  role: 'admin' | 'member'
}