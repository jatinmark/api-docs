'use client'

import { Mail } from 'lucide-react'

export function ContactSupport() {
  return (
    <div className="px-3 py-2">
      <a
        href="mailto:connect@conversailabs.com"
        className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors"
      >
        <Mail className="mr-2 h-4 w-4" />
        <span>Contact Support</span>
      </a>
      <p className="text-xs text-gray-500 mt-1 pl-6">
        connect@conversailabs.com
      </p>
    </div>
  )
}