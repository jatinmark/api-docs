'use client'

import { useQuery } from '@tanstack/react-query'
import { TemplateAPI, TemplateResponse } from '@/lib/template-api'
import { useAuth } from '@/contexts/AuthContext'

// Query Keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  industries: () => [...templateKeys.all, 'industries'] as const,
}

// Get all templates
export function useTemplates(filters?: { industry?: string; use_case?: string }) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: templateKeys.list(filters || {}),
    queryFn: () => TemplateAPI.getAllTemplates(tokens?.access_token || ''),
    enabled: !!tokens?.access_token,
    staleTime: 4 * 60 * 60 * 1000, // 4 hours - templates are relatively static
    gcTime: 8 * 60 * 60 * 1000, // 8 hours in cache
  })
}

// Get templates by industry
export function useTemplatesByIndustry(industry: string) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: templateKeys.list({ industry }),
    queryFn: () => TemplateAPI.getTemplatesByIndustry(tokens?.access_token || ''),
    enabled: !!tokens?.access_token && !!industry,
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    gcTime: 8 * 60 * 60 * 1000, // 8 hours in cache
  })
}

// Get single template
export function useTemplate(templateId: string) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: templateKeys.detail(templateId),
    queryFn: () => TemplateAPI.getTemplate(templateId, tokens?.access_token || ''),
    enabled: !!tokens?.access_token && !!templateId,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours - individual templates rarely change
    gcTime: 12 * 60 * 60 * 1000, // 12 hours in cache
  })
}

// Get available industries (for template filtering)
export function useTemplateIndustries() {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: templateKeys.industries(),
    queryFn: async () => {
      const data = await TemplateAPI.getAllTemplates(tokens?.access_token || '')
      const industries = Array.from(new Set(data.templates.map(t => t.industry)))
      return industries.sort()
    },
    enabled: !!tokens?.access_token,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - industries are very static
    gcTime: 48 * 60 * 60 * 1000, // 48 hours in cache
  })
}

// Get available use cases for a specific industry
export function useTemplateUseCases(industry?: string) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: [...templateKeys.all, 'use_cases', industry || 'all'],
    queryFn: async () => {
      const data = await TemplateAPI.getAllTemplates(tokens?.access_token || '', 
        industry ? { industry } : {}
      )
      const useCases = Array.from(new Set(data.templates.map(t => t.use_case)))
      return useCases.sort()
    },
    enabled: !!tokens?.access_token,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours in cache
  })
}

// Get filtered templates by both industry and use case
export function useFilteredTemplates(filters: { industry?: string; use_case?: string }) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn: () => TemplateAPI.getAllTemplates(tokens?.access_token || '', filters),
    enabled: !!tokens?.access_token && (!!filters.industry || !!filters.use_case),
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    gcTime: 8 * 60 * 60 * 1000, // 8 hours in cache
  })
}