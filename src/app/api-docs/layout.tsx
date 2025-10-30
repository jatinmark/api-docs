import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation | ConversAI Labs',
  description: 'Internal and Admin API documentation for ConversAI Labs Voice AI platform',
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
