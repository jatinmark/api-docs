# Voice AI Sales Agent Admin Panel Frontend

A Next.js admin panel for managing Voice AI sales agents, leads, and call history.

## Features

- **Authentication System** - Google OAuth & JWT with 60-day tokens
- **Agent Management** - Create, edit, and manage AI voice agents
- **Lead Management** - Import leads via CSV, schedule calls
- **Call History** - View call transcripts, metrics, and analytics
- **Voice Selection** - Choose from multiple voice options
- **Template System** - Pre-built templates for various industries

## Tech Stack

- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **React Context API** for state management
- **JWT Authentication** with auto-refresh
- **Real-time API integration** with backend

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NODE_ENV=development
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open the application:**
Visit [http://localhost:3000](http://localhost:3000)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Authentication

**Development Mode:**
- Use any email address to login
- No Google OAuth required for testing

**Production Mode:**
- Requires Google OAuth configuration
- Set `NODE_ENV=production` in environment

### API Integration

The frontend integrates with the backend API running on `localhost:8080/api/v1`:

- **Authentication**: `/auth/test-login`, `/auth/me`, `/auth/profile`
- **Agents**: `/agents/` CRUD operations
- **Leads**: `/leads/` management and CSV import
- **Calls**: `/calls/history` and `/calls/metrics`
- **Voices**: `/agents/voices/` for voice selection

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── agents/         # Agent management page
│   ├── calls/          # Call history page
│   ├── company/        # Company settings page
│   ├── leads/          # Lead management page
│   ├── login/          # Authentication page
│   └── onboarding/     # User onboarding flow
├── components/         # React components
│   ├── agents/        # Agent-specific components
│   ├── auth/          # Authentication components
│   ├── calls/         # Call-related components
│   ├── layout/        # Layout components
│   ├── leads/         # Lead management components
│   └── ui/            # Reusable UI components
├── contexts/          # React contexts
├── lib/               # API clients and utilities
└── types/             # TypeScript type definitions
```

## Key Components

### Agent Creation Wizard
4-step wizard for creating AI agents:
1. Basic information and template selection
2. AI configuration (prompt, welcome message)
3. Voice and language selection
4. Call flow configuration and phone setup

### CSV Lead Import
- Drag & drop CSV file upload
- Column mapping interface
- Real-time import progress
- Error handling and validation

### Call History & Analytics
- Filterable call history table
- Real-time metrics dashboard
- Call detail modals with transcripts
- Export functionality

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Private repository - All rights reserved.