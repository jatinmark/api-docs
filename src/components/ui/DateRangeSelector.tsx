'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { CustomDropdown } from './CustomDropdown'

interface DateRangeSelectorProps {
  value: {
    start_date: string
    end_date: string
  }
  onChange: (value: { start_date: string; end_date: string }) => void
  className?: string
}

export function DateRangeSelector({ value, onChange, className = '' }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [customStart, setCustomStart] = useState(value.start_date || '')
  const [customEnd, setCustomEnd] = useState(value.end_date || '')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get today's date in YYYY-MM-DD format
  const getToday = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Get yesterday's date
  const getYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }

  // Get date N days ago
  const getDaysAgo = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }

  // Get first day of current month
  const getThisMonthStart = () => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split('T')[0]
  }

  // Get last month range
  const getLastMonth = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
    return {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0]
    }
  }

  const presetOptions = [
    { label: 'All time', value: 'all', dates: { start_date: '', end_date: '' } },
    { label: 'Today', value: 'today', dates: () => ({ start_date: getToday(), end_date: getToday() }) },
    { label: 'Yesterday', value: 'yesterday', dates: () => ({ start_date: getYesterday(), end_date: getYesterday() }) },
    { label: 'Last 7 days', value: 'last7', dates: () => ({ start_date: getDaysAgo(6), end_date: getToday() }) },
    { label: 'This month', value: 'thisMonth', dates: () => ({ start_date: getThisMonthStart(), end_date: getToday() }) },
    { label: 'Last month', value: 'lastMonth', dates: () => getLastMonth() },
    { label: 'Custom range...', value: 'custom', dates: null }
  ]

  // Determine current selection value and label
  const getCurrentSelection = () => {
    if (!value.start_date && !value.end_date) {
      return { value: 'all', label: 'All time' }
    }

    // Check if matches any preset
    for (const preset of presetOptions) {
      if (preset.dates && typeof preset.dates === 'function') {
        const presetValue = preset.dates()
        if (presetValue.start_date === value.start_date && presetValue.end_date === value.end_date) {
          return { value: preset.value, label: preset.label }
        }
      } else if (preset.dates && typeof preset.dates === 'object') {
        if (preset.dates.start_date === value.start_date && preset.dates.end_date === value.end_date) {
          return { value: preset.value, label: preset.label }
        }
      }
    }

    // Custom range
    if (value.start_date === value.end_date && value.start_date) {
      return { value: 'custom', label: new Date(value.start_date).toLocaleDateString() }
    }

    if (value.start_date && value.end_date) {
      const start = new Date(value.start_date).toLocaleDateString()
      const end = new Date(value.end_date).toLocaleDateString()
      return { value: 'custom', label: `${start} - ${end}` }
    }

    if (value.start_date) {
      return { value: 'custom', label: `From ${new Date(value.start_date).toLocaleDateString()}` }
    }

    if (value.end_date) {
      return { value: 'custom', label: `Until ${new Date(value.end_date).toLocaleDateString()}` }
    }

    return { value: 'custom', label: 'Select dates' }
  }

  // Handle selection change
  const handleSelectionChange = (selectedValue: string) => {
    const preset = presetOptions.find(p => p.value === selectedValue)

    if (preset?.value === 'custom') {
      setShowCustomRange(true)
      return
    }

    if (preset?.dates) {
      const newDates = typeof preset.dates === 'function' ? preset.dates() : preset.dates
      onChange(newDates)
      setShowCustomRange(false)
    }
  }

  // Handle custom range apply
  const handleCustomRangeApply = () => {
    onChange({
      start_date: customStart,
      end_date: customEnd
    })
    setIsOpen(false)
    setShowCustomRange(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCustomRange(false)
      }
    }

    if (showCustomRange && isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showCustomRange, isOpen])

  const currentSelection = getCurrentSelection()

  // If showing custom range, render the custom UI
  if (showCustomRange) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm">{currentSelection.label}</span>
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      setShowCustomRange(false)
                      setCustomStart(value.start_date)
                      setCustomEnd(value.end_date)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    onClick={handleCustomRangeApply}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Use CustomDropdown for preset selections
  return (
    <CustomDropdown
      options={presetOptions
        .filter(p => p.value !== 'custom')
        .map(p => ({
          value: p.value,
          label: p.label,
          icon: <Calendar className="h-4 w-4" />
        }))
        .concat([
          { value: 'custom', label: 'Custom range...', icon: <Calendar className="h-4 w-4" /> }
        ])}
      value={currentSelection.value}
      onChange={handleSelectionChange}
      placeholder="Select date range"
      icon={<Calendar className="h-4 w-4" />}
      className={className}
    />
  )
}