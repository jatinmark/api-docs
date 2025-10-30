'use client';

import { useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface NavItem {
  title: string;
  href: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  items?: NavItem[];
}

const methodColors = {
  GET: 'bg-emerald-600 text-emerald-50',
  POST: 'bg-blue-600 text-blue-50',
  PUT: 'bg-amber-600 text-amber-50',
  PATCH: 'bg-orange-600 text-orange-50',
  DELETE: 'bg-rose-600 text-rose-50',
};

const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '#setup',
    items: [
      { title: 'Environment Setup', href: '#setup' },
      { title: 'Authentication', href: '#auth' },
    ],
  },
  {
    title: 'Agent Management',
    href: '#agent-management',
    items: [
      { title: 'List Agents', href: '#list-agents', method: 'GET' },
      { title: 'Update Agent', href: '#update-agent', method: 'PUT' },
      { title: 'Delete Agent', href: '#delete-agent', method: 'DELETE' },
    ],
  },
  {
    title: 'Lead Management',
    href: '#lead-management',
    items: [
      { title: 'Add Lead', href: '#add-lead', method: 'POST' },
      { title: 'Get Lead', href: '#get-lead', method: 'GET' },
      { title: 'List Leads', href: '#list-leads', method: 'GET' },
      { title: 'Update Lead', href: '#update-lead', method: 'PUT' },
      { title: 'Delete Lead', href: '#delete-lead', method: 'DELETE' },
    ],
  },
  {
    title: 'Call Management',
    href: '#call-management',
    items: [
      { title: 'Initiate Call', href: '#initiate-call', method: 'POST' },
      { title: 'Get Call History', href: '#call-history', method: 'GET' },
      { title: 'Get Call Metrics', href: '#call-metrics', method: 'GET' },
    ],
  },
  {
    title: 'Webhook Management',
    href: '#webhook-management',
    items: [
      { title: 'Configure Webhook', href: '#configure-webhook', method: 'PUT' },
      { title: 'Get Webhook Config', href: '#get-webhook', method: 'GET' },
      { title: 'Delete Webhook', href: '#delete-webhook', method: 'DELETE' },
      { title: 'Send Test Webhook', href: '#test-webhook', method: 'POST' },
    ],
  },
];

export default function Sidebar() {
  const [openSections, setOpenSections] = useState<string[]>(['Getting Started', 'Agent Management', 'Lead Management', 'Call Management', 'Webhook Management']);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white h-screen sticky top-0 overflow-y-auto shadow-sm">
      <div className="p-6">
        <Link href="/api-docs" className="flex items-center gap-2 mb-8 group">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg group-hover:shadow-lg transition-shadow">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            API Docs
          </span>
        </Link>

        <nav className="space-y-1">
          {navigation.map((section) => (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-all"
              >
                <span>{section.title}</span>
                {section.items && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform text-slate-400 ${
                      openSections.includes(section.title) ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {section.items && openSections.includes(section.title) && (
                <div className="ml-3 mt-1 space-y-0.5">
                  {section.items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border-l-2 border-transparent hover:border-indigo-600"
                    >
                      {item.method && (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${methodColors[item.method]}`}>
                          {item.method === 'DELETE' ? 'DEL' : item.method}
                        </span>
                      )}
                      <span>{item.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
