'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useMembers, useRemoveMember } from '@/hooks/useMembers'
import { Button } from '@/components/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { AddMemberModal } from './AddMemberModal'
import { Plus, Trash2, Shield, User, Crown } from 'lucide-react'

export function MembersTab() {
  const { user } = useAuth()
  const { data: members, isLoading } = useMembers()
  const removeMember = useRemoveMember()
  const [showAddModal, setShowAddModal] = useState(false)
  
  const isOwnerOrAdmin = user?.role === 'company_admin' || user?.role === 'super_admin'
  
  const getRoleBadge = (role: string, isOwner: boolean) => {
    if (isOwner) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-full">
          <Crown className="w-3 h-3" />
          Owner
        </span>
      )
    }
    
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
          <Shield className="w-3 h-3" />
          Admin
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 rounded-full">
        <User className="w-3 h-3" />
        Member
      </span>
    )
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage who has access to your company account
          </p>
        </div>
        {isOwnerOrAdmin && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              {isOwnerOrAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.length === 0 ? (
              <TableRow>
                <TableCell {...{ colSpan: isOwnerOrAdmin ? 5 : 4 }} className="text-center py-8 text-gray-500">
                  No team members yet
                </TableCell>
              </TableRow>
            ) : (
              members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.email}</TableCell>
                  <TableCell>
                    {member.name || (
                      <span className="text-gray-400 italic">Pending setup</span>
                    )}
                  </TableCell>
                  <TableCell>{getRoleBadge(member.role, member.is_owner)}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(member.added_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  {isOwnerOrAdmin && (
                    <TableCell className="text-right">
                      {!member.is_owner && member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to remove this member?')) {
                              removeMember.mutate(member.user_id)
                            }
                          }}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}