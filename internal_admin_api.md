# Internal & Admin API Documentation

Simple curl commands for: Agent Management + Lead Management (CRUD) + Call Management (Schedule, History, Metrics) + Webhook Configuration

## Environment Setup
```bash
export API_KEY="your-api-key-here"
export DEV_URL="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
```

**Authentication Methods Supported:**
- `X-API-Key: <api-key>` (Recommended)
- `Authorization: Bearer <jwt-token>` (Also supported)

**Prerequisites:**
- Get your API key from the admin panel settings
- You need an existing `agent_id` to create leads (use `GET /api/v1/agents` to list agents)

---

## 1. List Agents

**Endpoint:** `GET /api/v1/agents`
**Authentication:** Required (X-API-Key or Bearer token)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10, max: 100)
- `status_filter` (optional): Filter by status (active|inactive)

**Curl (Using X-API-Key):**
```bash
curl -X GET "$DEV_URL/api/v1/agents?page=1&per_page=20&status_filter=active" \
  -H "X-API-Key: $API_KEY"
```

**Response:**
```json
{
  "agents": [
    {
      "id": "agent-uuid",
      "company_id": "company-uuid",
      "name": "Sales Agent",
      "status": "active",
      "prompt": "You are a professional sales agent...",
      "voice_id": "voice-uuid",
      "inbound_phone": "+1234567890",
      "outbound_phone": "+0987654321",
      "max_attempts": 3,
      "retry_delay_minutes": 30,
      "region": "worldwide",
      "phone_status": "complete",
      "phone_numbers_configured": true,
      "created_at": "2025-01-27T10:30:00Z",
      "updated_at": "2025-01-27T10:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "per_page": 20
}
```

---

## 2. Update Agent

**Endpoint:** `PUT /api/v1/agents/{agent_id}`
**Authentication:** Required (X-API-Key or Bearer token)

**Request (all fields optional):**
```json
{
  "name": "Updated Agent Name",
  "status": "active",
  "prompt": "Updated agent prompt...",
  "welcome_message": "Updated welcome message",
  "voice_id": "new-voice-uuid",
  "inbound_phone": "+1111111111",
  "outbound_phone": "+2222222222",
  "max_attempts": 5,
  "retry_delay_minutes": 60,
  "max_call_duration_minutes": 30,
  "enable_sales_cycle": true,
  "default_call_days": [1, 2, 3]
}
```

**Curl (Using X-API-Key):**
```bash
curl -X PUT "$DEV_URL/api/v1/agents/{agent_id}" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Agent Name",
    "status": "active",
    "max_attempts": 5
  }'
```

**Response:**
```json
{
  "id": "agent-uuid",
  "company_id": "company-uuid",
  "name": "Updated Agent Name",
  "status": "active",
  "prompt": "Updated agent prompt...",
  "updated_at": "2025-01-27T11:00:00Z"
}
```

---

## 3. Delete Agent

**Endpoint:** `DELETE /api/v1/agents/{agent_id}`
**Authentication:** Required (X-API-Key or Bearer token)

**Curl (Using X-API-Key):**
```bash
curl -X DELETE "$DEV_URL/api/v1/agents/{agent_id}" \
  -H "X-API-Key: $API_KEY"
```

**Response:**
```json
{
  "message": "Agent deleted"
}
```

---

## 4. Add Lead

**Endpoint:** `POST /api/v1/leads`
**Authentication:** Required (X-API-Key or Bearer token)

**Request:**
```json
{
  "agent_id": "agent-uuid",
  "first_name": "John Doe",
  "phone_e164": "+1234567890",
  "custom_fields": {
    "email": "john@example.com",
    "company": "ABC Corp"
  }
}
```

**Curl (Using X-API-Key):**
```bash
curl -X POST "$DEV_URL/api/v1/leads" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "your-agent-uuid",
    "first_name": "John Doe",
    "phone_e164": "+1234567890",
    "custom_fields": {
      "email": "john@example.com"
    }
  }'
```

**Response:**
```json
{
  "id": "lead-uuid",
  "agent_id": "agent-uuid",
  "first_name": "John Doe",
  "phone_e164": "+1234567890",
  "status": "new",
  "created_at": "2025-01-27T10:30:00Z"
}
```

---

## 5. Get Lead

**Endpoint:** `GET /api/v1/leads/{lead_id}`
**Authentication:** Required (X-API-Key or Bearer token)

**Curl (Using X-API-Key):**
```bash
curl -X GET "$DEV_URL/api/v1/leads/{lead_id}" \
  -H "X-API-Key: $API_KEY"
```

**Response:**
```json
{
  "id": "lead-uuid",
  "agent_id": "agent-uuid",
  "first_name": "John Doe",
  "phone_e164": "+1234567890",
  "status": "new",
  "custom_fields": {
    "email": "john@example.com"
  },
  "schedule_at": "2025-01-27T10:30:00Z",
  "attempts_count": 0,
  "disposition": null,
  "created_at": "2025-01-27T10:30:00Z",
  "updated_at": "2025-01-27T10:30:00Z"
}
```

---

## 6. List Leads

**Endpoint:** `GET /api/v1/leads`
**Authentication:** Required (X-API-Key or Bearer token)

**Query Parameters:**
- `agent_id` (optional): Filter by agent
- `status_filter` (optional): Filter by status (new|in_progress|done|stopped)
- `search` (optional): Search by name or phone
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10, max: 100)

**Curl (Using X-API-Key):**
```bash
curl -X GET "$DEV_URL/api/v1/leads?agent_id=your-agent-uuid&status_filter=new&page=1&per_page=20" \
  -H "X-API-Key: $API_KEY"
```

**Response:**
```json
{
  "leads": [
    {
      "id": "lead-uuid",
      "agent_id": "agent-uuid",
      "first_name": "John Doe",
      "phone_e164": "+1234567890",
      "status": "new",
      "custom_fields": {},
      "attempts_count": 0,
      "created_at": "2025-01-27T10:30:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "per_page": 20
}
```

---

## 7. Update Lead

**Endpoint:** `PUT /api/v1/leads/{lead_id}`
**Authentication:** Required (X-API-Key or Bearer token)

**Request (all fields optional):**
```json
{
  "first_name": "Jane Doe",
  "phone_e164": "+1987654321",
  "status": "in_progress",
  "custom_fields": {
    "email": "jane@example.com",
    "company": "XYZ Corp"
  },
  "schedule_at": "2025-01-28T14:00:00Z",
  "disposition": "not_interested"
}
```

**Curl (Using X-API-Key):**
```bash
curl -X PUT "$DEV_URL/api/v1/leads/{lead_id}" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane Doe",
    "status": "in_progress"
  }'
```

**Response:**
```json
{
  "id": "lead-uuid",
  "agent_id": "agent-uuid",
  "first_name": "Jane Doe",
  "phone_e164": "+1987654321",
  "status": "in_progress",
  "custom_fields": {
    "email": "jane@example.com"
  },
  "updated_at": "2025-01-27T11:00:00Z"
}
```

---

## 8. Delete Lead

**Endpoint:** `DELETE /api/v1/leads/{lead_id}`
**Authentication:** Required (X-API-Key or Bearer token)

**Curl (Using X-API-Key):**
```bash
curl -X DELETE "$DEV_URL/api/v1/leads/{lead_id}" \
  -H "X-API-Key: $API_KEY"
```

**Response:**
```json
{
  "message": "Lead deleted successfully"
}
```

---

## 9. Initiate Call

**Endpoint:** `POST /api/v1/calls/schedule`
**Authentication:** Required (X-API-Key or Bearer token)

**Request:**
```json
{
  "lead_id": "lead-uuid"
}
```

**Curl (Using X-API-Key):**
```bash
curl -X POST "$DEV_URL/api/v1/calls/schedule" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "your-lead-uuid"
  }'
```

---

## 10. Get Call History

**Endpoint:** `GET /api/v1/calls/history`
**Authentication:** Required (X-API-Key or Bearer token)

**Query Parameters:**
- `agent_id` (optional): Filter by agent
- `outcome` (optional): Filter by outcome (answered|no_answer|failed)
- `start_date` (optional): Filter by start date (YYYY-MM-DD)
- `end_date` (optional): Filter by end date (YYYY-MM-DD)
- `search` (optional): Search by lead name or phone
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10, max: 100)

**Curl (Using X-API-Key):**
```bash
curl -X GET "$DEV_URL/api/v1/calls/history?agent_id=your-agent-uuid&outcome=answered&page=1&per_page=20" \
  -H "X-API-Key: $API_KEY"
```

**Response:**
```json
{
  "calls": [
    {
      "id": "interaction-uuid",
      "lead_id": "lead-uuid",
      "agent_id": "agent-uuid",
      "attempt_number": 1,
      "status": "completed",
      "outcome": "answered",
      "summary": "Call completed successfully",
      "duration_seconds": 120,
      "transcript_url": "https://...",
      "retell_call_id": "call-id",
      "lead_name": "John Doe",
      "lead_phone": "+1234567890",
      "agent_name": "Sales Agent",
      "call_type": "outbound",
      "ai_insights": {
        "call_type": "first_call",
        "sentiment": "positive"
      },
      "created_at": "2025-01-27T10:30:00Z",
      "updated_at": "2025-01-27T10:32:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 20
}
```

---

## 11. Get Call Metrics

**Endpoint:** `GET /api/v1/calls/metrics`
**Authentication:** Required (X-API-Key or Bearer token)

**Query Parameters:**
- `agent_id` (optional): Filter by agent
- `start_date` (optional): Filter by start date (YYYY-MM-DD)
- `end_date` (optional): Filter by end date (YYYY-MM-DD)

**Curl (Using X-API-Key):**
```bash
curl -X GET "$DEV_URL/api/v1/calls/metrics?agent_id=your-agent-uuid&start_date=2025-01-01&end_date=2025-01-31" \
  -H "X-API-Key: $API_KEY"
```

**Response:**
```json
{
  "total_calls": 150,
  "answered_calls": 90,
  "no_answer_calls": 45,
  "failed_calls": 15,
  "pickup_rate": 60.0,
  "average_attempts_per_lead": 2.5,
  "active_agents": 5
}
```

---

## 12. Configure Webhook

**Endpoint:** `PUT /api/v1/webhooks/config`
**Authentication:** Required (X-API-Key or Bearer token)

**Request:**
```json
{
  "webhook_url": "https://your-domain.com/webhook",
  "enabled": true,
  "events": ["call.started", "call.completed", "call.failed", "call.analysed"]
}
```

**Fields:**
- `webhook_url` (required): Your endpoint URL
- `enabled` (optional): Enable/disable (default: true)
- `events` (optional): Event types - `call.started`, `call.completed`, `call.failed`, `call.analysed` (default: all)

**Curl (Using X-API-Key):**
```bash
curl -X PUT "$DEV_URL/api/v1/webhooks/config" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://your-domain.com/webhook",
    "enabled": true,
    "events": ["call.started", "call.completed", "call.failed", "call.analysed"]
  }'
```

**Response:**
```json
{
  "webhook_url": "https://your-domain.com/webhook",
  "enabled": true,
  "events": ["call.started", "call.completed", "call.failed", "call.analysed"]
}
```

---

## 13. Get Webhook Configuration

**Endpoint:** `GET /api/v1/webhooks/config`
**Authentication:** Required (X-API-Key or Bearer token)

**Curl (Using X-API-Key):**
```bash
curl -X GET "$DEV_URL/api/v1/webhooks/config" \
  -H "X-API-Key: $API_KEY"
```

**Response:**
```json
{
  "webhook_url": "https://your-domain.com/webhook",
  "enabled": true,
  "events": ["call.started", "call.completed", "call.failed", "call.analysed"]
}
```

---

## 14. Delete Webhook Configuration

**Endpoint:** `DELETE /api/v1/webhooks/config`
**Authentication:** Required (X-API-Key or Bearer token)

**Curl (Using X-API-Key):**
```bash
curl -X DELETE "$DEV_URL/api/v1/webhooks/config" \
  -H "X-API-Key: $API_KEY"
```

**Response:**
```json
{
  "message": "Webhook configuration deleted successfully"
}
```

---

## 15. Send Test Webhook

**Endpoint:** `POST /api/v1/webhooks/test`
**Authentication:** Required (X-API-Key or Bearer token)

**Request:**
```json
{
  "event_type": "call.completed"
}
```

**Fields:**
- `event_type` (optional): `call.started`, `call.completed`, `call.failed`, or `call.analysed` (default: call.completed)

**Curl (Using X-API-Key):**
```bash
curl -X POST "$DEV_URL/api/v1/webhooks/test" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "call.completed"}'
```

**Response:**
```json
{
  "status": "success",
  "message": "Test webhook sent to https://your-domain.com/webhook",
  "response_status": 200
}
```

---

## Complete Workflow Script

```bash
#!/bin/bash
set -e

# Prerequisites: Get your API key from the admin panel
# Set your API key as environment variable
export API_KEY="your-api-key-here"
export DEV_URL="https://voice-ai-admin-api-762279639608.asia-south1.run.app"

# 1. Add Lead (replace YOUR_AGENT_UUID with actual agent UUID)
LEAD=$(curl -s -X POST "$DEV_URL/api/v1/leads" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "YOUR_AGENT_UUID",
    "first_name": "John Doe",
    "phone_e164": "+1234567890"
  }')

LEAD_ID=$(echo $LEAD | jq -r '.id')
echo "✅ Lead created: $LEAD_ID"

# 2. Initiate Call
CALL_RESPONSE=$(curl -s -X POST "$DEV_URL/api/v1/calls/schedule" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"lead_id\": \"$LEAD_ID\"}")

echo "✅ Call initiated!"
echo ""
echo "Summary:"
echo "  Lead ID: $LEAD_ID"
```

---

## Webhook Events

When webhooks are configured, the system sends event notifications to your webhook URL for the following events:

### call.started
Triggered when a call begins.

**Payload Example:**
```json
{
  "event": "call.started",
  "timestamp": "2025-01-15T10:30:00Z",
  "call_id": "uuid",
  "lead_id": "uuid",
  "agent_id": "uuid",
  "phone_number": "+1234567890",
  "lead_name": "John Doe"
}
```

### call.completed
Triggered **immediately** when a call ends (basic call information, NO AI analysis).

**Payload Example:**
```json
{
  "event": "call.completed",
  "timestamp": "2025-01-15T10:35:00Z",
  "call_id": "uuid",
  "lead_id": "uuid",
  "agent_id": "uuid",
  "duration_seconds": 125,
  "tokens_consumed": 5,
  "status": "completed",
  "outcome": "answered",
  "summary": "Call completed successfully",
  "recording_url": "https://...",
  "transcript": "..."
}
```

**Note:** AI analysis is NOT included in this event. Use `call.analysed` event to receive AI analysis results.

### call.analysed
Triggered when AI analysis completes (includes all call details + AI analysis).

**Payload Example:**
```json
{
  "event": "call.analysed",
  "timestamp": "2025-01-15T10:35:30Z",
  "call_id": "uuid",
  "lead_id": "uuid",
  "agent_id": "uuid",
  "duration_seconds": 125,
  "tokens_consumed": 5,
  "status": "completed",
  "outcome": "answered",
  "summary": "Call completed successfully",
  "ai_analysis": {
    "sentiment": "positive",
    "key_points": ["Customer interested in product demo", "Budget confirmed at $50k"],
    "next_action": "Schedule product demonstration",
    "call_successful": true,
    "custom_analysis_data": {}
  },
  "recording_url": "https://...",
  "transcript": "..."
}
```

**Note:** This event fires after `call.completed`, typically 5-30 seconds later when AI analysis finishes processing.

### call.failed
Triggered when a call fails.

**Payload Example:**
```json
{
  "event": "call.failed",
  "timestamp": "2025-01-15T10:32:00Z",
  "call_id": "uuid",
  "lead_id": "uuid",
  "agent_id": "uuid",
  "failure_reason": "no_answer",
  "error_message": "Call was not answered",
  "status": "failed"
}
```

**Failure Reasons:** `no_answer`, `busy`, `invalid_number`, `provider_error`, `insufficient_tokens`, `timeout`, `other`

**Webhook Delivery Notes:**
- **Retry Logic**: Failed deliveries retry at 1min, 5min, 15min (max 4 attempts)
- **Success Criteria**: HTTP 2xx status codes = success, other codes trigger retry
- **Timeout**: 30 seconds per delivery attempt
- **Idempotency**: Use `call_id` to deduplicate events at your endpoint

---

## Notes

**API Summary:**
- **Agent Management**:
  - List Agents: `GET /api/v1/agents` (with pagination & filters)
  - Update Agent: `PUT /api/v1/agents/{agent_id}`
  - Delete Agent: `DELETE /api/v1/agents/{agent_id}`
- **Lead Management**: Full CRUD operations (Create, Read, Update, Delete)
  - Create Lead: `POST /api/v1/leads`
  - Get Single Lead: `GET /api/v1/leads/{lead_id}`
  - List Leads: `GET /api/v1/leads` (with filters & pagination)
  - Update Lead: `PUT /api/v1/leads/{lead_id}`
  - Delete Lead: `DELETE /api/v1/leads/{lead_id}`
- **Call Management**:
  - Initiate Call: `POST /api/v1/calls/schedule`
  - Get Call History: `GET /api/v1/calls/history` (with filters & pagination)
  - Get Call Metrics: `GET /api/v1/calls/metrics` (statistics)
- **Webhook Management**:
  - Configure Webhook: `PUT /api/v1/webhooks/config`
  - Get Configuration: `GET /api/v1/webhooks/config`
  - Delete Configuration: `DELETE /api/v1/webhooks/config`
  - Send Test Webhook: `POST /api/v1/webhooks/test`

**Getting Started:**
1. Get your API key from the admin panel settings
2. Find your `agent_id` using `GET /api/v1/agents` with authentication
3. Use the workflow script above to add leads and initiate calls
4. Use GET/PUT/DELETE endpoints for lead management

**Authentication:**
- **X-API-Key**: Best for server-to-server integrations, long-lived, no expiration
- **JWT Token**: Can also be used (obtained via login), expires after ~30 days

**Field Constraints:**
- **phone_e164**: Must be in E.164 format (e.g., +1234567890)
- **status**: Valid values: `new`, `in_progress`, `done`, `stopped`
- **disposition**: Valid values: `not_interested`, `hung_up`, `completed`, `no_answer`
