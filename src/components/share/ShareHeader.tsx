'use client'

import { MessageSquare, ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function ShareHeader() {
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const handleScheduleDemo = () => {
    window.location.href = '/login'
  }

  const industries = [
    'Healthcare', 'Finance', 'Education', 'Real Estate', 'Technology',
    'Retail', 'Manufacturing', 'Hospitality', 'Insurance', 'Legal',
    'Marketing', 'Consulting'
  ]

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              {/* MessageSquare Icon */}
                <MessageSquare className="w-8 h-8 text-blue-600" />
              {/* Brand Name */}
              <div>
                <h1 className="text-xl font-bold text-gray-900">ConversAI Labs</h1>
                <p className="text-xs text-gray-500">AI-Powered Conversations</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* <a href="#features" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Features
            </a> */}
            
            {/* Industries Dropdown
            <div className="relative">
              <button
                onClick={() => setIsIndustriesOpen(!isIndustriesOpen)}
                onMouseEnter={() => setIsIndustriesOpen(true)}
                onMouseLeave={() => setIsIndustriesOpen(false)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Industries
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              
              {isIndustriesOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
                  onMouseEnter={() => setIsIndustriesOpen(true)}
                  onMouseLeave={() => setIsIndustriesOpen(false)}
                >
                  {industries.map((industry) => (
                    <a
                      key={industry}
                      href={`#${industry.toLowerCase()}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                      {industry}
                    </a>
                  ))}
                </div>
              )}
            </div> */}
            
            <a href="https://www.conversailabs.com/call-iq" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Call IQ
            </a>
            {/* <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Pricing
            </a> */}
            <a href="https://www.conversailabs.com/about" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              About
            </a>
          </nav>

          {/* Desktop CTA Button */}
          <button
            onClick={handleScheduleDemo}
            className="hidden md:block px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
          >
            Schedule Demo
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <nav className="px-4 py-3 space-y-3">
              <a href="#features" className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Features
              </a>
              
              {/* Mobile Industries */}
              <div>
                <button
                  onClick={() => setIsIndustriesOpen(!isIndustriesOpen)}
                  className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Industries
                  <ChevronDown className={`h-4 w-4 transition-transform ${isIndustriesOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isIndustriesOpen && (
                  <div className="mt-2 ml-4 space-y-2">
                    {industries.map((industry) => (
                      <a
                        key={industry}
                        href={`#${industry.toLowerCase()}`}
                        className="block py-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {industry}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              <a href="#calliq" className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Call IQ
              </a>
              <a href="#pricing" className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Pricing
              </a>
              <a href="#about" className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                About
              </a>
              
              {/* Mobile CTA Button */}
              <button
                onClick={handleScheduleDemo}
                className="w-full mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                Schedule Demo
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}