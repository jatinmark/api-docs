'use client';

import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: 'bash' | 'json' | 'typescript' | 'javascript' | 'python';
  title?: string;
  showLineNumbers?: boolean;
}

const languageLabels = {
  bash: 'Shell',
  json: 'JSON',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
};

export default function CodeBlock({ code, language = 'bash', title, showLineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="relative group my-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 text-slate-300 px-4 py-2.5 text-xs font-medium rounded-t-xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold">{title || languageLabels[language]}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs transition-all hover:shadow-md"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-medium">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="relative bg-[#0f172a] rounded-b-xl overflow-hidden border-x border-b border-slate-700 shadow-xl">
        <pre className="p-5 overflow-x-auto text-sm leading-relaxed">
          <code className={`language-${language} text-slate-200 font-mono`}>
            {showLineNumbers ? (
              <table className="w-full">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className="text-slate-500 select-none pr-4 text-right w-8">
                        {i + 1}
                      </td>
                      <td>{line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
