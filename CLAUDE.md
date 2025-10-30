# ConversAI Labs Admin Frontend

## Overview
Admin frontend for ConversAI Labs Voice AI system. Built with Next.js 14, TypeScript, Tailwind CSS. Manages AI voice agents, leads, calls, and analytics.

## Tech Stack
- **Framework**: Next.js 14 + App Router
- **State**: React Query (@tanstack/react-query) 
- **Auth**: Google OAuth + JWT
- **API**: Environment-based configuration

## Key Features

### 🚀 Production Voice Calling
- Retell AI integration with outbound calling
- Real-time webhooks (new → in_progress → done)
- Call history with transcripts/summaries

### 🎯 Lead Management
- CSV import, smart filtering, status tracking
- One-click call scheduling with instant feedback

### 📞 Call Analytics
- Live status updates, pickup rates, metrics
- Advanced filtering by agent/outcome/date

### 🤖 Agent Management
- Multi-channel (Voice + WhatsApp)
- Template integration, voice configuration
- Real-time status controls

### 🔐 Authentication
- Google OAuth (production) + email login (dev)
- Environment-based auth switching

## Caching Strategy
```typescript
// React Query TTL settings
Agents: 15min | Voices: 24hr | Templates: 4hr
Leads: 2min | Calls: 1min + 30s refresh
```

## Key Hooks

### Data Hooks
- `useLeads()` - 2min cache, optimistic updates
- `useCallHistory()` - 1min cache + real-time refresh
- `useAgents()` - 15min cache, optimistic CRUD
- `useVoices()` - 24hr cache (static data)

### Performance Hooks
- `usePolling()` - Auto-cleanup with race condition prevention
- `useAbortController()` - Request cancellation management
- `useEventListener()` - Safe event handling with cleanup
- `useNetworkStatus()` - Online/offline detection
- `useLoadingOperation()` - Individual loading state management
- `usePagination()` - Pagination state management

## Environment Config

### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
```

## Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript validation
```

## File Structure
```
src/
├── app/           # Pages (Next.js App Router)
├── components/    # UI components
├── hooks/         # React Query hooks
├── lib/           # API clients
├── contexts/      # Auth + Query contexts
└── types/         # TypeScript definitions
```

## Recent Updates

### Phase 1-2: Core Stability (Completed)
- **Memory Leak Fixes**: Custom hooks (usePolling, useAbortController, useEventListener)
- **Production Logging**: Logger service replacing console.log statements
- **Error Boundaries**: Proper error recovery mechanisms
- **Race Condition Prevention**: Enhanced polling with request sequencing

### Phase 4: UX Improvements (In Progress)
- **Skeleton Loaders**: Full component library for loading states
- **Loading Context**: Centralized loading state management
- **Network Status**: Online/offline detection with adaptive loading
- **Retry Logic**: Exponential backoff with circuit breaker pattern
- **Pagination**: Reusable pagination component with size selector
- **Suspense Boundaries**: Enhanced async component loading

## Security Notes
- Google Client ID was removed from git history (cleaned)
- 8 GitHub security alerts pending (1 critical, 3 high)
- Production code sanitized for public release
- Never save credentials/secrets in files which are getting checked in

## Support
**Contact**: connect@conversailabs.com  
**Issues**: Login (check OAuth config), API errors (verify tokens), cache issues (check TTL)

---
**Last Updated**: June 29, 2025 | **Author**: shashuec@gmail.com