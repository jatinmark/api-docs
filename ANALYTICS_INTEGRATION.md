# Admin Panel Analytics Integration Guide

## Overview

Admin Panel ab track karega:
- **User-wise behavior** (kon sa user kya kar raha hai)
- **Authentication** (Login, Logout)
- **Agent Management** (Agent created, edited, deleted)
- **Lead Management** (Leads imported, called, exported)
- **Call Management** (Calls scheduled, completed, recordings played)
- **UI Interactions** (Button clicks, modal opens, tab changes)

---

## Setup (2 Minutes)

### 1. Add GA4 Measurement ID

```bash
# Create .env.local
cp .env.example .env.local

# Add same GA4 ID as website (for unified tracking)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-0GPY5W63GC
```

### 2. Start Dev Server

```bash
npm run dev
```

### 3. Test in GA4 DebugView

1. Open [analytics.google.com](https://analytics.google.com)
2. Click **Configure** (⚙️) → **DebugView**
3. Login to admin panel
4. Watch events appear in real-time

---

## Integration Examples

### 1. Track Login (Set User ID)

When user logs in successfully:

```tsx
// In your login component/handler
import { trackLogin, setUserId } from '@/lib/analytics'

const handleLoginSuccess = (userEmail: string) => {
  // Set user ID for all future events
  trackLogin(userEmail, 'google')

  // Or if you want to set additional user properties:
  setUserProperties({
    user_id: userEmail,
    role: 'admin',
    company_id: 'conversailabs'
  })
}
```

### 2. Track Agent Created

```tsx
import { trackAgentCreated } from '@/lib/analytics'

const handleAgentCreate = async (agentData) => {
  try {
    const agent = await createAgent(agentData)

    // Track event
    trackAgentCreated(agentData.type, agentData.template)

    // Show success...
  } catch (error) {
    // Handle error...
  }
}
```

### 3. Track Leads Imported

```tsx
import { trackLeadsImported } from '@/lib/analytics'

const handleCSVImport = async (file) => {
  try {
    const result = await importLeads(file)

    // Track event with lead count
    trackLeadsImported(result.count, 'csv')

    // Show success...
  } catch (error) {
    // Handle error...
  }
}
```

### 4. Track Button Clicks

```tsx
import { useButtonClickTracking } from '@/hooks/useAnalytics'

function CreateAgentButton() {
  const trackClick = useButtonClickTracking('Create Agent', 'agents_page')

  return (
    <button onClick={() => {
      trackClick()
      // Your existing onClick logic...
    }}>
      Create Agent
    </button>
  )
}
```

### 5. Track Modal Open/Close

```tsx
import { useModalTracking } from '@/hooks/useAnalytics'

function AgentModal() {
  const { trackOpen, trackClose } = useModalTracking('agent_edit_modal')

  useEffect(() => {
    trackOpen() // Track when modal opens
    return () => trackClose() // Track when modal closes
  }, [])

  return <div>Modal content...</div>
}
```

### 6. Track Call Scheduled

```tsx
import { trackCallScheduled } from '@/lib/analytics'

const handleCallSchedule = async (leadId, agentId) => {
  try {
    await scheduleCall(leadId, agentId)

    // Track event
    trackCallScheduled(leadId, agentId)

    // Show success...
  } catch (error) {
    // Handle error...
  }
}
```

### 7. Track Time on Page

```tsx
import { usePageTimeTracking } from '@/hooks/useAnalytics'

export default function AgentsPage() {
  // Automatically tracks time spent on page
  usePageTimeTracking('agents')

  return <div>Agents page content...</div>
}
```

---

## Available Tracking Functions

### Authentication
- `trackLogin(userId, method)` - Track login + set user ID
- `trackLogout()` - Track logout
- `trackLoginFailure(reason)` - Track failed login

### Agent Management
- `trackAgentCreated(type, template)` - Agent created
- `trackAgentEdited(agentId, changeType)` - Agent edited
- `trackAgentDeleted(agentId)` - Agent deleted
- `trackAgentStatusChanged(agentId, newStatus)` - Status changed
- `trackAgentVoiceChanged(agentId, voiceId)` - Voice changed

### Lead Management
- `trackLeadsImported(count, source)` - Leads imported
- `trackLeadCalled(leadId, agentId)` - Lead called
- `trackLeadStatusChanged(leadId, newStatus)` - Status changed
- `trackLeadExported(count, format)` - Leads exported

### Call Management
- `trackCallScheduled(leadId, agentId)` - Call scheduled
- `trackCallCompleted(callId, duration, outcome)` - Call completed
- `trackCallRecordingPlayed(callId)` - Recording played
- `trackCallFilterApplied(filterType, filterValue)` - Filter applied

### UI Interactions
- `trackButtonClicked(buttonName, location)` - Button clicked
- `trackModalOpened(modalName)` - Modal opened
- `trackModalClosed(modalName)` - Modal closed
- `trackTabChanged(tabName, section)` - Tab changed
- `trackSearchPerformed(searchTerm, resultsCount, searchType)` - Search performed

### Errors
- `trackError(errorMessage, errorType)` - Track errors
- `trackAPIError(endpoint, statusCode, errorMessage)` - Track API errors

---

## User-Wise Analysis in GA4

### View User Journey

1. **GA4 → Explore → User Explorer**
2. **Add filter**: `user_id` = specific email
3. **See timeline**: All events by that user in chronological order

Example timeline for `saumya@conversailabs.com`:
```
10:00 AM → login (method: google)
10:02 AM → agent_created (type: voice)
10:05 AM → leads_imported (count: 150)
10:10 AM → call_scheduled
10:15 AM → page_view (path: /calls)
10:20 AM → logout
```

### BigQuery Query for User Journey

```sql
SELECT
  user_id,
  event_name,
  TIMESTAMP_MICROS(event_timestamp) as event_time,
  event_params
FROM `your-project.analytics_xxx.events_*`
WHERE user_id = 'saumya@conversailabs.com'
  AND _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', CURRENT_DATE())
ORDER BY event_timestamp ASC
```

### Common Analytics Queries

**Most Active Users:**
```sql
SELECT
  user_id,
  COUNT(*) as total_actions
FROM `your-project.analytics_xxx.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  AND user_id IS NOT NULL
GROUP BY user_id
ORDER BY total_actions DESC
LIMIT 10
```

**Agent Creation by User:**
```sql
SELECT
  user_id,
  COUNT(*) as agents_created
FROM `your-project.analytics_xxx.events_*`
WHERE event_name = 'agent_created'
  AND _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY user_id
ORDER BY agents_created DESC
```

**Call Success Rate by User:**
```sql
SELECT
  user_id,
  COUNTIF(event_name = 'call_scheduled') as calls_scheduled,
  COUNTIF(event_name = 'call_completed') as calls_completed,
  SAFE_DIVIDE(
    COUNTIF(event_name = 'call_completed'),
    COUNTIF(event_name = 'call_scheduled')
  ) * 100 as completion_rate_percent
FROM `your-project.analytics_xxx.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  AND user_id IS NOT NULL
GROUP BY user_id
ORDER BY completion_rate_percent DESC
```

---

## Priority Integration Points

### Must Add Tracking:

1. **Login Component** (HIGH PRIORITY)
   - `trackLogin(userEmail)` after successful login
   - This sets user ID for ALL future events

2. **Agent CRUD Operations**
   - `trackAgentCreated()` after agent creation
   - `trackAgentEdited()` after agent edit
   - `trackAgentDeleted()` after agent delete

3. **Lead Import**
   - `trackLeadsImported(count, 'csv')` after CSV import

4. **Call Actions**
   - `trackCallScheduled()` when scheduling call
   - `trackCallCompleted()` when call finishes

### Nice to Have:

5. **Button Clicks** - Use `useButtonClickTracking()` hook
6. **Modal Tracking** - Use `useModalTracking()` hook
7. **Error Tracking** - Use `trackError()` and `trackAPIError()`

---

## Testing Checklist

### Local Testing (DebugView)

- [ ] Login → `login` event with user_id
- [ ] Create Agent → `agent_created` event
- [ ] Import Leads → `leads_imported` event with count
- [ ] Schedule Call → `call_scheduled` event
- [ ] Page navigation → `page_view` events
- [ ] All events have user_id parameter

### Production Testing

After deployment, check:
- [ ] GA4 Realtime Report shows events
- [ ] User Explorer shows user journeys
- [ ] BigQuery exports working (if enabled)

---

## Support

**Questions?**
- Check browser console for analytics logs
- Verify GA4 Measurement ID in `.env.local`
- Email: connect@conversailabs.com

---

**Last Updated**: January 2025
