import { ReactNode } from 'react';
import EndpointCard from './EndpointCard';

interface ApiEndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  description: string;
  authRequired?: boolean;
  children: ReactNode;
  codePanel: ReactNode;
}

export default function ApiEndpoint({
  method,
  endpoint,
  description,
  authRequired = true,
  children,
  codePanel,
}: ApiEndpointProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      {/* Left Panel - Documentation */}
      <div className="space-y-6">
        <EndpointCard
          method={method}
          endpoint={endpoint}
          description={description}
          authRequired={authRequired}
        />
        {children}
      </div>

      {/* Right Panel - Code Examples */}
      <div className="lg:sticky lg:top-20 h-fit">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
          {codePanel}
        </div>
      </div>
    </div>
  );
}
