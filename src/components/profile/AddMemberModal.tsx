'use client'

import { useState, FormEvent } from 'react'
import { useAddMember } from '@/hooks/useMembers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'

interface AddMemberModalProps {
  onClose: () => void
}

export function AddMemberModal({ onClose }: AddMemberModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const addMember = useAddMember()
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !name || !phone) return
    if (authMethod === 'email' && !password) return

    try {
      const payload = {
        email,
        name,
        phone,
        role,
        ...(authMethod === 'email' && { password })
      }
      await addMember.mutateAsync(payload)
      onClose()
    } catch (error) {
      // Error is handled by the hook
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Add Team Member</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={addMember.isPending}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@company.com"
              required
              disabled={addMember.isPending}
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              required
              disabled={addMember.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="authMethod"
                  value="google"
                  checked={authMethod === 'google'}
                  onChange={() => {
                    setAuthMethod('google')
                    setPassword('')
                  }}
                  disabled={addMember.isPending}
                  className="mr-2"
                />
                <span className="text-sm">Google Login (Email only)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="authMethod"
                  value="email"
                  checked={authMethod === 'email'}
                  onChange={() => setAuthMethod('email')}
                  disabled={addMember.isPending}
                  className="mr-2"
                />
                <span className="text-sm">Email & Password</span>
              </label>
            </div>
          </div>

          {authMethod === 'email' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set password for member"
                  required={authMethod === 'email'}
                  minLength={8}
                  disabled={addMember.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this password with the member securely
              </p>
            </div>
          )}

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={addMember.isPending}
            >
              <option value="member">Member - Can view and use resources</option>
              <option value="admin">Admin - Can manage resources and members</option>
            </select>
          </div>
          
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm text-gray-600">
              {authMethod === 'google'
                ? "Member will sign in using their Google account with this email."
                : "Member will sign in using the email and password you set."}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={addMember.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!email || !name || !phone || (authMethod === 'email' && !password) || addMember.isPending}
            >
              {addMember.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}