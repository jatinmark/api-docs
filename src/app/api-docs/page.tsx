import ApiEndpoint from '@/components/docs/ApiEndpoint';
import ApiSection from '@/components/docs/ApiSection';
import Sidebar from '@/components/docs/Sidebar';
import TableOfContents from '@/components/docs/TableOfContents';
import Callout from '@/components/docs/Callout';
import CodeTabs from '@/components/docs/CodeTabs';
import ParametersTable from '@/components/docs/ParametersTable';
import ApiPlayground from '@/components/docs/ApiPlayground';
import { Book, Key } from 'lucide-react';

export default function ApiDocsPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl px-8 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Book className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              API Reference
            </h1>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed">
            Complete guide for managing leads, initiating AI-powered calls, and configuring webhooks
          </p>
        </div>

        {/* Environment Setup */}
        <ApiSection title="Environment Setup" id="setup">
          <Callout type="info" title="Quick Start">
            Set these environment variables before making API calls
          </Callout>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
                Base URL
              </h3>
              <code className="block bg-slate-100 text-slate-800 px-4 py-3 rounded-lg border border-slate-200 font-mono text-sm">
                https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1
              </code>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
                API Key
              </h3>
              <code className="block bg-slate-100 text-slate-800 px-4 py-3 rounded-lg border border-slate-200 font-mono text-sm">
                your-api-key-here
              </code>
            </div>
          </div>
        </ApiSection>

        {/* Authentication */}
        <ApiSection title="Authentication" id="auth">
          <Callout type="warning" title="API Key Authentication">
            <p className="text-sm">
              All API requests must be authenticated using an API key. The API key should be included in the request header.
            </p>
            <code className="block mt-2 text-xs bg-white px-2 py-1 rounded border">
              X-API-Key: &lt;your-api-key&gt;
            </code>
          </Callout>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Getting Your API Key</h3>
                <p className="text-sm text-slate-600">
                  For existing accounts and new accounts, retrieve your API key from the admin panel dashboard → profile settings. Can be used for all API calls.
                </p>
              </div>
            </div>
          </div>
        </ApiSection>

        {/* Agent Management Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
            Agent Management
          </h2>
        </div>

        {/* List Agents Endpoint */}
        <ApiSection title="List Agents" id="list-agents">
          <ApiEndpoint
            method="GET"
            endpoint="/api/v1/agents"
            description="Retrieve a paginated list of AI agents with optional filtering by status."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X GET "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/agents?page=1&per_page=20&status_filter=active" \\
  -H "X-API-Key: your-api-key"`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const params = new URLSearchParams({
  page: '1',
  per_page: '20',
  status_filter: 'active'
});

const response = await fetch(\`https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/agents?\${params}\`, {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const data = await response.json();
console.log(\`Total agents: \${data.total}\`);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

params = {
    'page': 1,
    'per_page': 20,
    'status_filter': 'active'
}

response = requests.get(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/agents',
    headers={'X-API-Key': 'your-api-key'},
    params=params
)

data = response.json()
print(f"Total agents: {data['total']}")`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Query Parameters"
              parameters={[
                {
                  name: 'page',
                  type: 'number',
                  required: false,
                  description: 'Page number (default: 1)',
                },
                {
                  name: 'per_page',
                  type: 'number',
                  required: false,
                  description: 'Items per page (default: 10, max: 100)',
                },
                {
                  name: 'status_filter',
                  type: 'string',
                  required: false,
                  description: 'Filter by status (active, inactive)',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'agents',
                  type: 'array',
                  description: 'Array of agent objects',
                },
                {
                  name: 'agents[].id',
                  type: 'uuid',
                  description: 'Agent UUID',
                },
                {
                  name: 'agents[].name',
                  type: 'string',
                  description: 'Agent name',
                },
                {
                  name: 'agents[].status',
                  type: 'string',
                  description: 'Agent status (active, inactive)',
                },
                {
                  name: 'agents[].prompt',
                  type: 'string',
                  description: 'Agent conversation prompt',
                },
                {
                  name: 'agents[].voice_id',
                  type: 'uuid',
                  description: 'Voice configuration UUID',
                },
                {
                  name: 'agents[].max_attempts',
                  type: 'number',
                  description: 'Maximum call attempts per lead',
                },
                {
                  name: 'agents[].retry_delay_minutes',
                  type: 'number',
                  description: 'Delay between retry attempts',
                },
                {
                  name: 'total',
                  type: 'number',
                  description: 'Total number of agents',
                },
                {
                  name: 'page',
                  type: 'number',
                  description: 'Current page number',
                },
                {
                  name: 'per_page',
                  type: 'number',
                  description: 'Items per page',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="GET"
                endpoint="/api/v1/agents"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'page', type: 'number', required: false, description: 'Page number', defaultValue: '1' },
                  { name: 'per_page', type: 'number', required: false, description: 'Items per page', defaultValue: '10' },
                  { name: 'status_filter', type: 'string', required: false, description: 'Filter by status', defaultValue: 'active' },
                ]}
              />
            </div>
          </ApiEndpoint>
        </ApiSection>

        {/* Update Agent Endpoint */}
        <ApiSection title="Update Agent" id="update-agent">
          <ApiEndpoint
            method="PUT"
            endpoint="/api/v1/agents/{agent_id}"
            description="Update an existing agent's configuration. All fields are optional - only include fields you want to update."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X PUT "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/agents/{agent_id}" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Updated Agent Name",
    "status": "active",
    "max_attempts": 5
  }'`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/agents/{agent_id}', {
  method: 'PUT',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Updated Agent Name',
    status: 'active',
    max_attempts: 5
  })
});

const updatedAgent = await response.json();
console.log('Agent updated:', updatedAgent);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.put(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/agents/{agent_id}',
    headers={'X-API-Key': 'your-api-key'},
    json={
        'name': 'Updated Agent Name',
        'status': 'active',
        'max_attempts': 5
    }
)

updated_agent = response.json()
print(f"Agent updated: {updated_agent}")`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Path Parameters"
              parameters={[
                {
                  name: 'agent_id',
                  type: 'uuid',
                  required: true,
                  description: 'UUID of the agent to update',
                },
              ]}
            />

            <ParametersTable
              title="Request Body (all fields optional)"
              parameters={[
                {
                  name: 'name',
                  type: 'string',
                  required: false,
                  description: 'Agent name',
                },
                {
                  name: 'status',
                  type: 'string',
                  required: false,
                  description: 'Agent status (active, inactive)',
                },
                {
                  name: 'prompt',
                  type: 'string',
                  required: false,
                  description: 'Updated agent prompt',
                },
                {
                  name: 'welcome_message',
                  type: 'string',
                  required: false,
                  description: 'Updated welcome message',
                },
                {
                  name: 'voice_id',
                  type: 'uuid',
                  required: false,
                  description: 'Voice configuration UUID',
                },
                {
                  name: 'max_attempts',
                  type: 'number',
                  required: false,
                  description: 'Maximum call attempts per lead',
                },
                {
                  name: 'retry_delay_minutes',
                  type: 'number',
                  required: false,
                  description: 'Delay between retry attempts',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'id',
                  type: 'uuid',
                  description: 'Agent identifier',
                },
                {
                  name: 'name',
                  type: 'string',
                  description: 'Updated agent name',
                },
                {
                  name: 'status',
                  type: 'string',
                  description: 'Updated status',
                },
                {
                  name: 'updated_at',
                  type: 'datetime',
                  description: 'Timestamp of update',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="PUT"
                endpoint="/api/v1/agents/{agent_id}"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'agent_id', type: 'uuid', required: true, description: 'UUID of the agent to update', defaultValue: '' },
                  { name: 'name', type: 'string', required: false, description: 'Agent name', defaultValue: '' },
                  { name: 'status', type: 'string', required: false, description: 'Agent status', defaultValue: '' },
                ]}
              />
            </div>
          </ApiEndpoint>
        </ApiSection>

        {/* Delete Agent Endpoint */}
        <ApiSection title="Delete Agent" id="delete-agent">
          <ApiEndpoint
            method="DELETE"
            endpoint="/api/v1/agents/{agent_id}"
            description="Permanently delete an agent from your account. This action cannot be undone."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X DELETE "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/agents/{agent_id}" \\
  -H "X-API-Key: your-api-key"`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/agents/{agent_id}', {
  method: 'DELETE',
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const result = await response.json();
console.log(result.message);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.delete(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/agents/{agent_id}',
    headers={'X-API-Key': 'your-api-key'}
)

result = response.json()
print(result['message'])`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Path Parameters"
              parameters={[
                {
                  name: 'agent_id',
                  type: 'uuid',
                  required: true,
                  description: 'UUID of the agent to delete',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'message',
                  type: 'string',
                  description: 'Success message: "Agent deleted"',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="DELETE"
                endpoint="/api/v1/agents/{agent_id}"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'agent_id', type: 'uuid', required: true, description: 'UUID of the agent to delete', defaultValue: '' },
                ]}
              />
            </div>

            <Callout type="danger" title="Warning">
              This action is permanent and cannot be undone. Deleting an agent will also affect all associated leads and call history.
            </Callout>
          </ApiEndpoint>
        </ApiSection>

        {/* Lead Management Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
            Lead Management
          </h2>
        </div>

        {/* Add Lead Endpoint */}
        <ApiSection title="Add Lead" id="add-lead">
          <ApiEndpoint
            method="POST"
            endpoint="/api/v1/leads/"
            description="Create a new lead associated with an AI agent. The lead will be available for calling once created."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X POST "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "b0b52c8c-b5c8-474a-a9fb-109473f436b4",
    "first_name": "John Doe",
    "phone_e164": "+14155552671",
    "custom_fields": {
      "email": "john@example.com",
      "company": "ABC Corp"
    }
  }'`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    agent_id: 'b0b52c8c-b5c8-474a-a9fb-109473f436b4',
    first_name: 'John Doe',
    phone_e164: '+14155552671',
    custom_fields: {
      email: 'john@example.com',
      company: 'ABC Corp'
    }
  })
});

const lead = await response.json();
console.log('Lead ID:', lead.id);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.post(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/',
    headers={'X-API-Key': 'your-api-key'},
    json={
        'agent_id': 'b0b52c8c-b5c8-474a-a9fb-109473f436b4',
        'first_name': 'John Doe',
        'phone_e164': '+14155552671',
        'custom_fields': {
            'email': 'john@example.com',
            'company': 'ABC Corp'
        }
    }
)

lead = response.json()
print(f"Lead ID: {lead['id']}")`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Request Body"
              parameters={[
                {
                  name: 'agent_id',
                  type: 'uuid',
                  required: true,
                  description: 'UUID of the agent that will call this lead',
                },
                {
                  name: 'first_name',
                  type: 'string',
                  required: true,
                  description: 'Lead\'s full name',
                },
                {
                  name: 'phone_e164',
                  type: 'string',
                  required: true,
                  description: 'Phone number in E.164 format (e.g., +14155552671 for US, +919412792855 for India)',
                },
                {
                  name: 'custom_fields',
                  type: 'object',
                  required: false,
                  description: 'Additional custom data (email, company, etc.)',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'id',
                  type: 'uuid',
                  description: 'Unique lead identifier',
                },
                {
                  name: 'agent_id',
                  type: 'uuid',
                  description: 'Associated agent ID',
                },
                {
                  name: 'status',
                  type: 'string',
                  description: 'Lead status (new, contacted, scheduled, etc.)',
                },
                {
                  name: 'is_verified',
                  type: 'boolean',
                  description: 'Whether the phone number is verified',
                },
                {
                  name: 'created_at',
                  type: 'datetime',
                  description: 'Timestamp when lead was created',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="POST"
                endpoint="/api/v1/leads/"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'agent_id', type: 'uuid', required: true, description: 'UUID of the agent', defaultValue: 'b0b52c8c-b5c8-474a-a9fb-109473f436b4' },
                  { name: 'first_name', type: 'string', required: true, description: 'Lead\'s full name', defaultValue: 'John Doe' },
                  { name: 'phone_e164', type: 'string', required: true, description: 'Phone in E.164 format', defaultValue: '+14155552671' },
                ]}
              />
            </div>

            <Callout type="warning" title="Important Note">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Phone numbers must be in E.164 format</li>
                <li>Ensure the trailing slash in the endpoint: <code>/api/v1/leads/</code></li>
                <li>Indian numbers are auto-verified with &quot;company_verified&quot; method</li>
              </ul>
            </Callout>
          </ApiEndpoint>
        </ApiSection>

        {/* Get Lead Endpoint */}
        <ApiSection title="Get Lead" id="get-lead">
          <ApiEndpoint
            method="GET"
            endpoint="/api/v1/leads/{lead_id}"
            description="Retrieve detailed information about a specific lead by its UUID."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X GET "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/{lead_id}" \\
  -H "X-API-Key: your-api-key"`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/{lead_id}', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const lead = await response.json();
console.log(lead);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.get(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/{lead_id}',
    headers={'X-API-Key': 'your-api-key'}
)

lead = response.json()
print(lead)`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Path Parameters"
              parameters={[
                {
                  name: 'lead_id',
                  type: 'uuid',
                  required: true,
                  description: 'UUID of the lead to retrieve',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'id',
                  type: 'uuid',
                  description: 'Unique lead identifier',
                },
                {
                  name: 'agent_id',
                  type: 'uuid',
                  description: 'Associated agent ID',
                },
                {
                  name: 'first_name',
                  type: 'string',
                  description: 'Lead\'s full name',
                },
                {
                  name: 'phone_e164',
                  type: 'string',
                  description: 'Phone number in E.164 format',
                },
                {
                  name: 'status',
                  type: 'string',
                  description: 'Lead status (new, in_progress, done, stopped)',
                },
                {
                  name: 'custom_fields',
                  type: 'object',
                  description: 'Custom data associated with the lead',
                },
                {
                  name: 'schedule_at',
                  type: 'datetime',
                  description: 'Scheduled call time',
                },
                {
                  name: 'attempts_count',
                  type: 'number',
                  description: 'Number of call attempts',
                },
                {
                  name: 'disposition',
                  type: 'string',
                  description: 'Call disposition',
                },
                {
                  name: 'created_at',
                  type: 'datetime',
                  description: 'Timestamp when lead was created',
                },
                {
                  name: 'updated_at',
                  type: 'datetime',
                  description: 'Timestamp when lead was last updated',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="GET"
                endpoint="/api/v1/leads/{lead_id}"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'lead_id', type: 'uuid', required: true, description: 'UUID of the lead to retrieve', defaultValue: '' },
                ]}
              />
            </div>
          </ApiEndpoint>
        </ApiSection>

        {/* List Leads Endpoint */}
        <ApiSection title="List Leads" id="list-leads">
          <ApiEndpoint
            method="GET"
            endpoint="/api/v1/leads"
            description="Retrieve a paginated list of leads with optional filtering by agent, status, or search term."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X GET "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads?agent_id=your-agent-uuid&status_filter=new&page=1&per_page=20" \\
  -H "X-API-Key: your-api-key"`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const params = new URLSearchParams({
  agent_id: 'your-agent-uuid',
  status_filter: 'new',
  page: '1',
  per_page: '20'
});

const response = await fetch(\`https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads?\${params}\`, {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const data = await response.json();
console.log(\`Total leads: \${data.total}\`);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

params = {
    'agent_id': 'your-agent-uuid',
    'status_filter': 'new',
    'page': 1,
    'per_page': 20
}

response = requests.get(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads',
    headers={'X-API-Key': 'your-api-key'},
    params=params
)

data = response.json()
print(f"Total leads: {data['total']}")`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Query Parameters"
              parameters={[
                {
                  name: 'agent_id',
                  type: 'uuid',
                  required: false,
                  description: 'Filter by agent UUID',
                },
                {
                  name: 'status_filter',
                  type: 'string',
                  required: false,
                  description: 'Filter by status (new, in_progress, done, stopped)',
                },
                {
                  name: 'search',
                  type: 'string',
                  required: false,
                  description: 'Search by name or phone number',
                },
                {
                  name: 'page',
                  type: 'number',
                  required: false,
                  description: 'Page number (default: 1)',
                },
                {
                  name: 'per_page',
                  type: 'number',
                  required: false,
                  description: 'Items per page (default: 10, max: 100)',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'leads',
                  type: 'array',
                  description: 'Array of lead objects',
                },
                {
                  name: 'total',
                  type: 'number',
                  description: 'Total number of leads matching filters',
                },
                {
                  name: 'page',
                  type: 'number',
                  description: 'Current page number',
                },
                {
                  name: 'per_page',
                  type: 'number',
                  description: 'Items per page',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="GET"
                endpoint="/api/v1/leads"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'agent_id', type: 'uuid', required: false, description: 'Filter by agent UUID', defaultValue: '' },
                  { name: 'status_filter', type: 'string', required: false, description: 'Filter by status', defaultValue: 'new' },
                  { name: 'search', type: 'string', required: false, description: 'Search by name or phone', defaultValue: '' },
                  { name: 'page', type: 'number', required: false, description: 'Page number', defaultValue: '1' },
                  { name: 'per_page', type: 'number', required: false, description: 'Items per page', defaultValue: '10' },
                ]}
              />
            </div>
          </ApiEndpoint>
        </ApiSection>

        {/* Update Lead Endpoint */}
        <ApiSection title="Update Lead" id="update-lead">
          <ApiEndpoint
            method="PUT"
            endpoint="/api/v1/leads/{lead_id}"
            description="Update an existing lead's information. All fields are optional - only include fields you want to update."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X PUT "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/{lead_id}" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "Jane Doe",
    "status": "in_progress"
  }'`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/{lead_id}', {
  method: 'PUT',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    first_name: 'Jane Doe',
    status: 'in_progress'
  })
});

const updatedLead = await response.json();
console.log('Updated:', updatedLead);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.put(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/{lead_id}',
    headers={'X-API-Key': 'your-api-key'},
    json={
        'first_name': 'Jane Doe',
        'status': 'in_progress'
    }
)

updated_lead = response.json()
print(f"Updated: {updated_lead}")`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Path Parameters"
              parameters={[
                {
                  name: 'lead_id',
                  type: 'uuid',
                  required: true,
                  description: 'UUID of the lead to update',
                },
              ]}
            />

            <ParametersTable
              title="Request Body (all fields optional)"
              parameters={[
                {
                  name: 'first_name',
                  type: 'string',
                  required: false,
                  description: 'Lead\'s full name',
                },
                {
                  name: 'phone_e164',
                  type: 'string',
                  required: false,
                  description: 'Phone number in E.164 format',
                },
                {
                  name: 'status',
                  type: 'string',
                  required: false,
                  description: 'Lead status (new, in_progress, done, stopped)',
                },
                {
                  name: 'custom_fields',
                  type: 'object',
                  required: false,
                  description: 'Custom data (email, company, etc.)',
                },
                {
                  name: 'schedule_at',
                  type: 'datetime',
                  required: false,
                  description: 'Scheduled call time (ISO 8601 format)',
                },
                {
                  name: 'disposition',
                  type: 'string',
                  required: false,
                  description: 'Call disposition (not_interested, hung_up, completed, no_answer)',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'id',
                  type: 'uuid',
                  description: 'Lead identifier',
                },
                {
                  name: 'agent_id',
                  type: 'uuid',
                  description: 'Associated agent ID',
                },
                {
                  name: 'first_name',
                  type: 'string',
                  description: 'Updated lead name',
                },
                {
                  name: 'status',
                  type: 'string',
                  description: 'Updated status',
                },
                {
                  name: 'updated_at',
                  type: 'datetime',
                  description: 'Timestamp of update',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="PUT"
                endpoint="/api/v1/leads/{lead_id}"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'lead_id', type: 'uuid', required: true, description: 'UUID of the lead to update', defaultValue: '' },
                  { name: 'first_name', type: 'string', required: false, description: 'Lead\'s full name', defaultValue: '' },
                  { name: 'phone_e164', type: 'string', required: false, description: 'Phone in E.164 format', defaultValue: '' },
                  { name: 'status', type: 'string', required: false, description: 'Lead status', defaultValue: '' },
                ]}
              />
            </div>
          </ApiEndpoint>
        </ApiSection>

        {/* Delete Lead Endpoint */}
        <ApiSection title="Delete Lead" id="delete-lead">
          <ApiEndpoint
            method="DELETE"
            endpoint="/api/v1/leads/{lead_id}"
            description="Permanently delete a lead from the system. This action cannot be undone."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X DELETE "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/{lead_id}" \\
  -H "X-API-Key: your-api-key"`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/{lead_id}', {
  method: 'DELETE',
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const result = await response.json();
console.log(result.message);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.delete(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/leads/{lead_id}',
    headers={'X-API-Key': 'your-api-key'}
)

result = response.json()
print(result['message'])`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Path Parameters"
              parameters={[
                {
                  name: 'lead_id',
                  type: 'uuid',
                  required: true,
                  description: 'UUID of the lead to delete',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'message',
                  type: 'string',
                  description: 'Success message: "Lead deleted successfully"',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="DELETE"
                endpoint="/api/v1/leads/{lead_id}"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'lead_id', type: 'uuid', required: true, description: 'UUID of the lead to delete', defaultValue: '' },
                ]}
              />
            </div>

            <Callout type="danger" title="Warning">
              This action is permanent and cannot be undone. Make sure you have the correct lead_id before proceeding.
            </Callout>
          </ApiEndpoint>
        </ApiSection>

        {/* Call Management Section */}
        <div className="mb-12 mt-16">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
            Call Management
          </h2>
        </div>

        {/* Initiate Call Endpoint */}
        <ApiSection title="Initiate Call" id="initiate-call">
          <ApiEndpoint
            method="POST"
            endpoint="/api/v1/calls/schedule"
            description="Schedule and initiate an AI-powered voice call to a lead. The call will be executed asynchronously."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X POST "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/calls/schedule" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "lead_id": "b0160b3d-9eb5-45e2-abd6-8b6b785fe941"
  }'`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/calls/schedule', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    lead_id: 'b0160b3d-9eb5-45e2-abd6-8b6b785fe941'
  })
});

const result = await response.json();
console.log(result.message);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.post(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/calls/schedule',
    headers={'X-API-Key': 'your-api-key'},
    json={'lead_id': 'b0160b3d-9eb5-45e2-abd6-8b6b785fe941'}
)

result = response.json()
print(result['message'])`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Request Body"
              parameters={[
                {
                  name: 'lead_id',
                  type: 'uuid',
                  required: true,
                  description: 'UUID of the lead to call',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'message',
                  type: 'string',
                  description: 'Success message (e.g., "Lead scheduled successfully")',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="POST"
                endpoint="/api/v1/calls/schedule"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'lead_id', type: 'uuid', required: true, description: 'UUID of the lead to call', defaultValue: 'b0160b3d-9eb5-45e2-abd6-8b6b785fe941' },
                ]}
              />
            </div>

            <Callout type="success" title="Call Initiated">
              The call will be processed asynchronously. Check the calls dashboard or use webhooks to track call status.
            </Callout>

            <Callout type="danger" title="Troubleshooting">
              If you receive &quot;Failed to initiate call&quot;, check:
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li>Agent configuration is complete with voice settings</li>
                <li>Lead exists and is in valid state</li>
                <li>Retell AI integration is properly configured</li>
              </ul>
            </Callout>
          </ApiEndpoint>
        </ApiSection>

        {/* Get Call History Endpoint */}
        <ApiSection title="Get Call History" id="call-history">
          <ApiEndpoint
            method="GET"
            endpoint="/api/v1/calls/history"
            description="Retrieve paginated call history with optional filtering by agent, outcome, date range, or search term."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X GET "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/calls/history?agent_id=your-agent-uuid&outcome=answered&page=1&per_page=20" \\
  -H "X-API-Key: your-api-key"`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const params = new URLSearchParams({
  agent_id: 'your-agent-uuid',
  outcome: 'answered',
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  page: '1',
  per_page: '20'
});

const response = await fetch(\`https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/calls/history?\${params}\`, {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const data = await response.json();
console.log(\`Total calls: \${data.total}\`);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

params = {
    'agent_id': 'your-agent-uuid',
    'outcome': 'answered',
    'start_date': '2025-01-01',
    'end_date': '2025-01-31',
    'page': 1,
    'per_page': 20
}

response = requests.get(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/calls/history',
    headers={'X-API-Key': 'your-api-key'},
    params=params
)

data = response.json()
print(f"Total calls: {data['total']}")`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Query Parameters"
              parameters={[
                {
                  name: 'agent_id',
                  type: 'uuid',
                  required: false,
                  description: 'Filter by agent UUID',
                },
                {
                  name: 'outcome',
                  type: 'string',
                  required: false,
                  description: 'Filter by outcome (answered, no_answer, failed)',
                },
                {
                  name: 'start_date',
                  type: 'string',
                  required: false,
                  description: 'Filter by start date (YYYY-MM-DD)',
                },
                {
                  name: 'end_date',
                  type: 'string',
                  required: false,
                  description: 'Filter by end date (YYYY-MM-DD)',
                },
                {
                  name: 'search',
                  type: 'string',
                  required: false,
                  description: 'Search by lead name or phone',
                },
                {
                  name: 'page',
                  type: 'number',
                  required: false,
                  description: 'Page number (default: 1)',
                },
                {
                  name: 'per_page',
                  type: 'number',
                  required: false,
                  description: 'Items per page (default: 10, max: 100)',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'calls',
                  type: 'array',
                  description: 'Array of call/interaction objects',
                },
                {
                  name: 'calls[].id',
                  type: 'uuid',
                  description: 'Interaction UUID',
                },
                {
                  name: 'calls[].lead_id',
                  type: 'uuid',
                  description: 'Associated lead UUID',
                },
                {
                  name: 'calls[].agent_id',
                  type: 'uuid',
                  description: 'Agent UUID',
                },
                {
                  name: 'calls[].status',
                  type: 'string',
                  description: 'Call status (completed, in_progress, failed)',
                },
                {
                  name: 'calls[].outcome',
                  type: 'string',
                  description: 'Call outcome (answered, no_answer, failed)',
                },
                {
                  name: 'calls[].duration_seconds',
                  type: 'number',
                  description: 'Call duration in seconds',
                },
                {
                  name: 'calls[].transcript_url',
                  type: 'string',
                  description: 'URL to call transcript',
                },
                {
                  name: 'calls[].summary',
                  type: 'string',
                  description: 'AI-generated call summary',
                },
                {
                  name: 'calls[].ai_insights',
                  type: 'object',
                  description: 'AI analysis and insights',
                },
                {
                  name: 'total',
                  type: 'number',
                  description: 'Total number of calls',
                },
                {
                  name: 'page',
                  type: 'number',
                  description: 'Current page number',
                },
                {
                  name: 'per_page',
                  type: 'number',
                  description: 'Items per page',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="GET"
                endpoint="/api/v1/calls/history"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'agent_id', type: 'uuid', required: false, description: 'Filter by agent UUID', defaultValue: '' },
                  { name: 'outcome', type: 'string', required: false, description: 'Filter by outcome', defaultValue: '' },
                  { name: 'start_date', type: 'string', required: false, description: 'Start date (YYYY-MM-DD)', defaultValue: '' },
                  { name: 'end_date', type: 'string', required: false, description: 'End date (YYYY-MM-DD)', defaultValue: '' },
                  { name: 'page', type: 'number', required: false, description: 'Page number', defaultValue: '1' },
                  { name: 'per_page', type: 'number', required: false, description: 'Items per page', defaultValue: '10' },
                ]}
              />
            </div>
          </ApiEndpoint>
        </ApiSection>

        {/* Get Call Metrics Endpoint */}
        <ApiSection title="Get Call Metrics" id="call-metrics">
          <ApiEndpoint
            method="GET"
            endpoint="/api/v1/calls/metrics"
            description="Retrieve aggregated call statistics and metrics with optional filtering by agent and date range."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X GET "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/calls/metrics?agent_id=your-agent-uuid&start_date=2025-01-01&end_date=2025-01-31" \\
  -H "X-API-Key: your-api-key"`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const params = new URLSearchParams({
  agent_id: 'your-agent-uuid',
  start_date: '2025-01-01',
  end_date: '2025-01-31'
});

const response = await fetch(\`https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/calls/metrics?\${params}\`, {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const metrics = await response.json();
console.log(\`Pickup rate: \${metrics.pickup_rate}%\`);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

params = {
    'agent_id': 'your-agent-uuid',
    'start_date': '2025-01-01',
    'end_date': '2025-01-31'
}

response = requests.get(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/calls/metrics',
    headers={'X-API-Key': 'your-api-key'},
    params=params
)

metrics = response.json()
print(f"Pickup rate: {metrics['pickup_rate']}%")`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Query Parameters"
              parameters={[
                {
                  name: 'agent_id',
                  type: 'uuid',
                  required: false,
                  description: 'Filter by agent UUID',
                },
                {
                  name: 'start_date',
                  type: 'string',
                  required: false,
                  description: 'Filter by start date (YYYY-MM-DD)',
                },
                {
                  name: 'end_date',
                  type: 'string',
                  required: false,
                  description: 'Filter by end date (YYYY-MM-DD)',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'total_calls',
                  type: 'number',
                  description: 'Total number of calls made',
                },
                {
                  name: 'answered_calls',
                  type: 'number',
                  description: 'Number of answered calls',
                },
                {
                  name: 'no_answer_calls',
                  type: 'number',
                  description: 'Number of unanswered calls',
                },
                {
                  name: 'failed_calls',
                  type: 'number',
                  description: 'Number of failed calls',
                },
                {
                  name: 'pickup_rate',
                  type: 'number',
                  description: 'Pickup rate percentage (0-100)',
                },
                {
                  name: 'average_attempts_per_lead',
                  type: 'number',
                  description: 'Average number of attempts per lead',
                },
                {
                  name: 'active_agents',
                  type: 'number',
                  description: 'Number of active agents',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="GET"
                endpoint="/api/v1/calls/metrics"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'agent_id', type: 'uuid', required: false, description: 'Filter by agent UUID', defaultValue: '' },
                  { name: 'start_date', type: 'string', required: false, description: 'Start date (YYYY-MM-DD)', defaultValue: '' },
                  { name: 'end_date', type: 'string', required: false, description: 'End date (YYYY-MM-DD)', defaultValue: '' },
                ]}
              />
            </div>

            <Callout type="info" title="Metrics Calculation">
              Pickup rate is calculated as (answered_calls / total_calls) × 100. All metrics respect the applied filters.
            </Callout>
          </ApiEndpoint>
        </ApiSection>

        {/* Webhook Management Section */}
        <div className="mb-12 mt-16">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
            Webhook Management
          </h2>
        </div>

        {/* Webhook Overview Section */}
        <div className="mb-12 prose prose-slate max-w-none">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Overview</h3>
            <p className="text-slate-700 leading-relaxed">
              Webhooks in ConversAI Labs provide a powerful way to respond to call events in real-time.
              By setting up webhooks, your applications can immediately react to specific call actions or changes,
              enhancing the interactivity and responsiveness of your integrations.
            </p>
          </div>

          {/* Types of Webhook Events */}
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">Types of Webhook Events</h3>
          <p className="text-slate-600 mb-6">
            Currently, ConversAI Labs supports the following webhook event types:
          </p>

          <div className="space-y-4 mb-8">
            <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-sm font-semibold text-emerald-700">call.started</code>
              </div>
              <p className="text-sm text-slate-700">
                Triggered when a call begins. This event fires immediately when an outbound call is initiated
                or an inbound call is received.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-sm font-semibold text-blue-700">call.completed</code>
              </div>
              <p className="text-sm text-slate-700">
                Triggered when a call ends. The event payload includes details like call duration, status, outcome,
                transcript, recording URL, and other relevant information. This event fires immediately upon call
                completion and does NOT include AI analysis.
              </p>
            </div>

            <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-sm font-semibold text-amber-700">call.analysed</code>
              </div>
              <p className="text-sm text-slate-700">
                Triggered when AI analysis completes, typically 5-30 seconds after the call ends. The event payload
                includes all call details PLUS AI-generated insights such as sentiment analysis, key points extracted
                from the conversation, and recommended next actions. Use this event when you need AI insights for your
                workflow automation.
              </p>
            </div>
          </div>

          {/* Use Case Example */}
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">Use Case Example</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
            <p className="text-slate-700 mb-4">
              Consider the <code className="text-blue-600 font-semibold">call.analysed</code> event. This event is triggered
              when AI processing completes for a call in your ConversAI Labs account. By listening to this event, you can
              capture important call details and AI-generated insights, then perform custom actions such as:
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="text-indigo-600">•</span>
                <span><strong>CRM Integration:</strong> Automatically update lead status in Salesforce or HubSpot based on call sentiment</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-600">•</span>
                <span><strong>Task Creation:</strong> Create follow-up tasks for sales reps based on AI-recommended next actions</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-600">•</span>
                <span><strong>Analytics:</strong> Stream call data and AI insights to your data warehouse for analysis</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-600">•</span>
                <span><strong>Notifications:</strong> Send Slack or email alerts to managers when high-value opportunities are detected</span>
              </li>
            </ul>
          </div>

          {/* Register Webhook */}
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">Register Webhook</h3>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
            <p className="text-slate-700 mb-4">
              Configure your webhook through the API to receive real-time event notifications. You can specify:
            </p>
            <ul className="space-y-2 text-sm text-slate-700 mb-6">
              <li className="flex gap-3">
                <span className="text-blue-600">✓</span>
                <span><strong>Webhook URL:</strong> Your HTTPS endpoint that will receive event notifications</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600">✓</span>
                <span><strong>Event Subscriptions:</strong> Choose which events to receive (or subscribe to all events)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600">✓</span>
                <span><strong>Enable/Disable:</strong> Toggle webhook delivery on or off without changing configuration</span>
              </li>
            </ul>

            <Callout type="warning" title="Webhook Delivery Requirements">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your endpoint must use <strong>HTTPS</strong> (HTTP is not supported)</li>
                <li>Return a <strong>2xx status code</strong> within 30 seconds to acknowledge receipt</li>
                <li>Failed deliveries are retried at 1min, 5min, and 15min intervals (max 4 attempts)</li>
                <li>Implement <strong>idempotency</strong> using <code>call_id</code> to handle duplicate events</li>
              </ul>
            </Callout>
          </div>

          {/* Webhook Payload Examples */}
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">Webhook Payload Examples</h3>

          <div className="space-y-6">
            {/* call.started payload */}
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm">call.started</span>
              </h4>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-slate-100">
{`{
  "event": "call.started",
  "timestamp": "2025-01-15T10:30:00Z",
  "call_id": "uuid",
  "lead_id": "uuid",
  "agent_id": "uuid",
  "phone_number": "+1234567890",
  "lead_name": "John Doe"
}`}
                </pre>
              </div>
            </div>

            {/* call.completed payload */}
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">call.completed</span>
              </h4>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-slate-100">
{`{
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
}`}
                </pre>
              </div>
              <p className="text-sm text-slate-600 mt-2 italic">
                Note: AI analysis is NOT included in this event. Use call.analysed for AI insights.
              </p>
            </div>

            {/* call.analysed payload */}
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm">call.analysed</span>
              </h4>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-slate-100">
{`{
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
    "key_points": [
      "Customer interested in product demo",
      "Budget confirmed at $50k"
    ],
    "next_action": "Schedule product demonstration",
    "call_successful": true,
    "custom_analysis_data": {}
  },
  "recording_url": "https://...",
  "transcript": "..."
}`}
                </pre>
              </div>
              <p className="text-sm text-slate-600 mt-2 italic">
                This event fires after call.completed, typically 5-30 seconds later when AI analysis finishes.
              </p>
            </div>
          </div>
        </div>

        {/* Configure Webhook Endpoint */}
        <ApiSection title="Configure Webhook" id="configure-webhook">
          <ApiEndpoint
            method="PUT"
            endpoint="/api/v1/webhooks/config"
            description="Configure webhook URL and event subscriptions for receiving real-time call status updates."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X PUT "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/config" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "webhook_url": "https://your-domain.com/webhook",
    "enabled": true,
    "events": ["call.started", "call.completed", "call.failed", "call.analysed"]
  }'`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/config', {
  method: 'PUT',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    webhook_url: 'https://your-domain.com/webhook',
    enabled: true,
    events: ['call.started', 'call.completed', 'call.failed', 'call.analysed']
  })
});

const config = await response.json();
console.log('Webhook configured:', config);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.put(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/config',
    headers={'X-API-Key': 'your-api-key'},
    json={
        'webhook_url': 'https://your-domain.com/webhook',
        'enabled': True,
        'events': ['call.started', 'call.completed', 'call.failed', 'call.analysed']
    }
)

config = response.json()
print(f"Webhook configured: {config}")`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Request Body"
              parameters={[
                {
                  name: 'webhook_url',
                  type: 'string',
                  required: true,
                  description: 'Your endpoint URL to receive webhook events',
                },
                {
                  name: 'enabled',
                  type: 'boolean',
                  required: false,
                  description: 'Enable/disable webhook (default: true)',
                },
                {
                  name: 'events',
                  type: 'array',
                  required: false,
                  description: 'Array of event types to subscribe to (default: all events)',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'webhook_url',
                  type: 'string',
                  description: 'Configured webhook URL',
                },
                {
                  name: 'enabled',
                  type: 'boolean',
                  description: 'Webhook enabled status',
                },
                {
                  name: 'events',
                  type: 'array',
                  description: 'Subscribed event types',
                },
              ]}
            />

            <Callout type="info" title="Available Events">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><code>call.started</code> - Triggered when a call begins</li>
                <li><code>call.completed</code> - Triggered immediately when a call ends (basic info, no AI analysis)</li>
                <li><code>call.failed</code> - Triggered when a call fails</li>
                <li><code>call.analysed</code> - Triggered when AI analysis completes (includes sentiment, insights, next actions)</li>
              </ul>
            </Callout>

            <div className="my-6">
              <ApiPlayground
                method="PUT"
                endpoint="/api/v1/webhooks/config"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'webhook_url', type: 'string', required: true, description: 'Your webhook endpoint URL', defaultValue: 'https://your-domain.com/webhook' },
                  { name: 'enabled', type: 'boolean', required: false, description: 'Enable/disable webhook', defaultValue: 'true' },
                ]}
              />
            </div>

            <Callout type="warning" title="Webhook Delivery">
              Failed deliveries will be retried at 1min, 5min, and 15min intervals (max 4 attempts). Ensure your endpoint returns 2xx status codes.
            </Callout>
          </ApiEndpoint>
        </ApiSection>

        {/* Get Webhook Configuration Endpoint */}
        <ApiSection title="Get Webhook Configuration" id="get-webhook">
          <ApiEndpoint
            method="GET"
            endpoint="/api/v1/webhooks/config"
            description="Retrieve the current webhook configuration including URL, enabled status, and subscribed events."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X GET "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/config" \\
  -H "X-API-Key: your-api-key"`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/config', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const config = await response.json();
console.log(config);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.get(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/config',
    headers={'X-API-Key': 'your-api-key'}
)

config = response.json()
print(config)`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'webhook_url',
                  type: 'string',
                  description: 'Configured webhook URL',
                },
                {
                  name: 'enabled',
                  type: 'boolean',
                  description: 'Whether webhook is enabled',
                },
                {
                  name: 'events',
                  type: 'array',
                  description: 'Array of subscribed event types',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="GET"
                endpoint="/api/v1/webhooks/config"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[]}
              />
            </div>
          </ApiEndpoint>
        </ApiSection>

        {/* Delete Webhook Configuration Endpoint */}
        <ApiSection title="Delete Webhook Configuration" id="delete-webhook">
          <ApiEndpoint
            method="DELETE"
            endpoint="/api/v1/webhooks/config"
            description="Remove the webhook configuration. This will stop all webhook event deliveries."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X DELETE "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/config" \\
  -H "X-API-Key: your-api-key"`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/config', {
  method: 'DELETE',
  headers: {
    'X-API-Key': 'your-api-key',
  },
});

const result = await response.json();
console.log(result.message);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.delete(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/config',
    headers={'X-API-Key': 'your-api-key'}
)

result = response.json()
print(result['message'])`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'message',
                  type: 'string',
                  description: 'Success message: "Webhook configuration deleted successfully"',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="DELETE"
                endpoint="/api/v1/webhooks/config"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[]}
              />
            </div>
          </ApiEndpoint>
        </ApiSection>

        {/* Send Test Webhook Endpoint */}
        <ApiSection title="Send Test Webhook" id="test-webhook">
          <ApiEndpoint
            method="POST"
            endpoint="/api/v1/webhooks/test"
            description="Send a test webhook event to verify your webhook endpoint is properly configured and receiving events."
            authRequired={true}
            codePanel={
              <CodeTabs
                title="Request Example"
                examples={[
                  {
                    language: 'bash',
                    label: 'cURL',
                    code: `curl -X POST "https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/test" \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"event_type": "call.completed"}'`,
                  },
                  {
                    language: 'javascript',
                    label: 'JavaScript',
                    code: `const response = await fetch('https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/test', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    event_type: 'call.completed'
  })
});

const result = await response.json();
console.log(result.message);`,
                  },
                  {
                    language: 'python',
                    label: 'Python',
                    code: `import requests

response = requests.post(
    'https://voice-ai-admin-api-762279639608.asia-south1.run.app/api/v1/webhooks/test',
    headers={'X-API-Key': 'your-api-key'},
    json={'event_type': 'call.completed'}
)

result = response.json()
print(result['message'])`,
                  },
                ]}
              />
            }
          >
            <ParametersTable
              title="Request Body"
              parameters={[
                {
                  name: 'event_type',
                  type: 'string',
                  required: false,
                  description: 'Event type to test (call.started, call.completed, call.failed). Default: call.completed',
                },
              ]}
            />

            <ParametersTable
              title="Response (200 OK)"
              parameters={[
                {
                  name: 'status',
                  type: 'string',
                  description: 'Test status (success/failure)',
                },
                {
                  name: 'message',
                  type: 'string',
                  description: 'Descriptive message',
                },
                {
                  name: 'response_status',
                  type: 'number',
                  description: 'HTTP status code from your webhook endpoint',
                },
              ]}
            />

            <div className="my-6">
              <ApiPlayground
                method="POST"
                endpoint="/api/v1/webhooks/test"
                baseUrl="https://voice-ai-admin-api-762279639608.asia-south1.run.app"
                parameters={[
                  { name: 'event_type', type: 'string', required: false, description: 'Event type to test', defaultValue: 'call.completed' },
                ]}
              />
            </div>

            <Callout type="success" title="Testing Tip">
              Use this endpoint to verify your webhook integration before going live. Check that your endpoint returns 200 status code.
            </Callout>
          </ApiEndpoint>
        </ApiSection>

        {/* Prerequisites & Notes */}
        <section className="mt-16 space-y-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
            Additional Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Callout type="warning" title="Prerequisites">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>You need an existing agent_id to create leads</li>
                <li>Use GET /api/v1/agents with authentication to list agents</li>
                <li>Phone numbers must be in E.164 format</li>
                <li>Get API key from admin panel settings</li>
              </ul>
            </Callout>

            <Callout type="info" title="Need Help?">
              <p className="text-sm">
                Contact us at{' '}
                <a href="mailto:connect@conversailabs.com" className="font-medium underline">
                  connect@conversailabs.com
                </a>
                {' '}for support or questions about the API.
              </p>
            </Callout>
          </div>
        </section>

        {/* Footer Spacing */}
        <div className="h-20" />
      </main>

      {/* Right Sidebar - Table of Contents */}
      <TableOfContents />
    </div>
  );
}
