import { ReactNode } from 'react';

interface ApiSectionProps {
  title: string;
  id?: string;
  children: ReactNode;
}

export default function ApiSection({ title, id, children }: ApiSectionProps) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-gradient-to-r from-indigo-500 to-purple-500">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
}
