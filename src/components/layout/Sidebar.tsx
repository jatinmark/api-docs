'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ContactSupport } from '@/components/ui/ContactSupport'
import { logger } from '@/lib/logger'
import {
  Bot,
  Users,
  Phone,
  History,
  LogOut,
  User,
  LayoutGrid,
  PhoneCall,
  Upload,
  Shield,
  Eye
} from 'lucide-react'

const getNavigation = (userRole?: string, showSuperAdmin?: boolean) => {
  const navigation = []

  // Super Admin section - only visible when toggled
  if (userRole === 'super_admin' && showSuperAdmin) {
    navigation.push(
      { name: 'SUPER ADMIN', type: 'section' },
      { name: 'View All Companies', href: '/super-admin/dashboard', icon: Eye }
    )
  }
  
  // VoiceAI items
  navigation.push(
    { name: 'VOICE AI', type: 'section' },
    { name: 'Campaigns', href: '/agents', icon: Bot },
    { name: 'Leads', href: '/leads', icon: Users },
    { name: 'Call History', href: '/calls', icon: History },
    { name: 'Phone Numbers', href: '/phone', icon: Phone }
  )

  // CalliQ items
  /* navigation.push(
    { name: 'CALL IQ', type: 'section' },
    { name: 'Dashboard', href: '/calliq/dashboard', icon: LayoutGrid },
    { name: 'Calls', href: '/calliq/calls', icon: PhoneCall },
    { name: 'Upload', href: '/calliq/upload', icon: Upload },
    // { name: 'Insights', href: '/calliq/insights', icon: Lightbulb },  // Hidden but not removed
  ) */
  
  return navigation
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()
  const [showSuperAdmin, setShowSuperAdmin] = useState(() => {
    // Initialize from localStorage on mount (SSR-safe)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showSuperAdmin')
      return saved === 'true'
    }
    return false
  })

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showSuperAdmin', String(showSuperAdmin))
    }
  }, [showSuperAdmin])

  // Handle double-click on ConversAI Labs to toggle Super Admin section
  const handleTitleDoubleClick = () => {
    if (user?.role === 'super_admin') {
      setShowSuperAdmin(!showSuperAdmin)
    }
  }

  // Get navigation items based on user role and Super Admin visibility
  const navigation = getNavigation(user?.role, showSuperAdmin)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      logger.error('Logout failed:', error)
    }
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 shadow-2xl">
      <div
        className="flex h-16 shrink-0 items-center px-6 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800 cursor-pointer select-none"
        onDoubleClick={handleTitleDoubleClick}
      >
        <h1 className="text-white text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          ConversAI Labs
        </h1>
        {user?.role === 'super_admin' && showSuperAdmin && (
          <Shield className="ml-2 h-4 w-4 text-yellow-500 animate-pulse" />
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin-dark">
        <div className="space-y-1 pb-2">
          {navigation.map((item, index) => {
            // Section headers
            if (item.type === 'section') {
              return (
                <div key={item.name}>
                  {/* Add separator line before sections */}
                  {((item.name === 'VOICE AI' && user?.role === 'super_admin' && showSuperAdmin) || item.name === 'CALL IQ') && (
                    <div className="mx-3 mb-4 mt-6 border-t border-gray-700/50 hover:border-gray-600 transition-colors duration-300"></div>
                  )}
                  <div className={cn(
                    "px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-default",
                    index > 0 && "mt-4"
                  )}>
                    {item.name === 'CALL IQ' ? (
                      <span className="calliq-brand-white hover:text-blue-300 transition-colors">{item.name}</span>
                    ) : item.name === 'VOICE AI' ? (
                      <span className="text-white hover:text-blue-300 transition-colors font-semibold">{item.name}</span>
                    ) : item.name === 'SUPER ADMIN' ? (
                      <span className="text-yellow-500 hover:text-yellow-400 transition-all hover:tracking-widest inline-flex items-center">
                        {item.name}
                        <Shield className="ml-1 h-3 w-3 animate-pulse" />
                      </span>
                    ) : (
                      <span className="text-gray-400 hover:text-gray-300 transition-colors">{item.name}</span>
                    )}
                  </div>
                </div>
              )
            }

            // Navigation links
            const isActive = pathname.startsWith(item.href!)
            return (
              <Link
                key={item.name}
                href={item.href!}
                className={cn(
                  'group relative flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gray-800 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/60 hover:text-white hover:pl-4'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full" />
                )}
                {item.icon && (
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 shrink-0 transition-all duration-200',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                      'group-hover:scale-110',
                      item.name === 'Settings' && 'group-hover:rotate-90'
                    )}
                  />
                )}
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-gray-700 p-4 space-y-2 bg-gray-900 shadow-lg">
        {user && (
          <Link
            href="/profile"
            className="flex items-center px-3 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-800/50 transition-all duration-200 group cursor-pointer"
          >
            <div className="relative">
              <User className="mr-3 h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="truncate">
              <div className="font-medium group-hover:text-white transition-colors">{user.name}</div>
              <div className="text-xs text-gray-400 group-hover:text-gray-300 truncate transition-colors">{user.email}</div>
            </div>
          </Link>
        )}
        <ContactSupport />
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="group relative flex w-full items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gradient-to-r hover:from-red-900/30 hover:to-red-800/30 hover:text-white disabled:opacity-50 transition-all duration-200 overflow-hidden"
        >
          <LogOut className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-400 transition-all duration-200 group-hover:translate-x-1" />
          <span className="group-hover:translate-x-1 transition-transform duration-200">
            {isLoading ? 'Signing out...' : 'Sign out'}
          </span>
        </button>
      </div>
    </div>
  )
}