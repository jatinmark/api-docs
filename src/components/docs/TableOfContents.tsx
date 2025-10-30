'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export default function TableOfContents() {
  const [activeId, setActiveId] = useState<string>('');
  const [headings, setHeadings] = useState<TocItem[]>([]);

  useEffect(() => {
    const elements = document.querySelectorAll('section[id]');
    const items: TocItem[] = Array.from(elements).map((elem) => ({
      id: elem.id,
      title: elem.querySelector('h2')?.textContent || '',
      level: 2,
    }));
    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    elements.forEach((elem) => observer.observe(elem));

    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside className="w-64 hidden xl:block">
      <div className="sticky top-20 pt-8 pr-6">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></span>
          On This Page
        </h3>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={`block text-sm py-2 border-l-2 pl-3 transition-all ${
                activeId === heading.id
                  ? 'border-indigo-600 text-indigo-600 font-semibold bg-indigo-50 -ml-px rounded-r'
                  : 'border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300'
              }`}
            >
              {heading.title}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
