'use client';

import { useState } from 'react';
import CodeBlock from './CodeBlock';

interface CodeExample {
  language: 'bash' | 'javascript' | 'python';
  label: string;
  code: string;
}

interface CodeTabsProps {
  examples: CodeExample[];
  title?: string;
}

export default function CodeTabs({ examples, title }: CodeTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === index
                ? 'bg-slate-800 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* Code Block */}
      <CodeBlock
        code={examples[activeTab].code}
        language={examples[activeTab].language}
        title={title}
      />
    </div>
  );
}
