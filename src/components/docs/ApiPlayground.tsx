'use client';

import { useState } from 'react';
import { Play, X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import CodeBlock from './CodeBlock';

interface ApiPlaygroundProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  parameters: {
    name: string;
    type: string;
    required?: boolean;
    description: string;
    defaultValue?: string;
  }[];
  baseUrl: string;
}

interface ResponseData {
  status: number;
  data: any;
  headers: Record<string, string>;
  time: number;
}

export default function ApiPlayground({ method, endpoint, parameters, baseUrl }: ApiPlaygroundProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {};
    parameters.forEach((param) => {
      if (param.defaultValue) {
        initialData[param.name] = param.defaultValue;
      }
    });
    return initialData;
  });
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const executeRequest = async () => {
    if (!apiKey) {
      setError('API Key is required');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();

    try {
      const url = `${baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      };

      if (method !== 'GET' && Object.keys(formData).length > 0) {
        options.body = JSON.stringify(formData);
      }

      const res = await fetch(url, options);
      const data = await res.json();
      const endTime = Date.now();

      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key] = value;
      });

      setResponse({
        status: res.status,
        data,
        headers,
        time: endTime - startTime,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to execute request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Try It Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
      >
        <Play className="w-4 h-4" />
        Try It
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Dialog */}
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">API Playground</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Test API endpoint directly from the docs</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* API Key Input */}
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  API Key <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm"
                />
              </div>

              {/* Parameters */}
              <div className="p-6 space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-1 h-4 bg-indigo-600 rounded"></span>
                  Request Body
                </h4>
                {parameters.map((param) => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {param.name}
                      {param.required && <span className="text-rose-600 ml-1">*</span>}
                      <span className="ml-2 text-xs text-slate-500">({param.type})</span>
                    </label>
                    <input
                      type="text"
                      value={formData[param.name] || ''}
                      onChange={(e) => handleInputChange(param.name, e.target.value)}
                      placeholder={param.description}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm"
                    />
                  </div>
                ))}
              </div>

              {/* Execute Button */}
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={executeRequest}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Send Request
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mx-6 mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-rose-900 mb-1">Error</h4>
                      <p className="text-sm text-rose-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Response Display */}
              {response && (
                <div className="mx-6 mb-6 border border-slate-200 rounded-lg overflow-hidden shadow-lg">
                  {/* Response Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="font-semibold">Response</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          response.status >= 200 && response.status < 300
                            ? 'bg-emerald-600'
                            : 'bg-rose-600'
                        }`}
                      >
                        {response.status}
                      </span>
                    </div>
                    <span className="text-sm text-slate-300">{response.time}ms</span>
                  </div>

                  {/* Response Body */}
                  <div className="p-4 bg-slate-50 max-h-96 overflow-y-auto">
                    <CodeBlock
                      code={JSON.stringify(response.data, null, 2)}
                      language="json"
                      title="Response Body"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
