interface EndpointCardProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  description?: string;
  authRequired?: boolean;
}

const methodColors = {
  GET: 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 border-cyan-300 shadow-cyan-100',
  POST: 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-300 shadow-emerald-100',
  PUT: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-300 shadow-amber-100',
  DELETE: 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-300 shadow-rose-100',
  PATCH: 'bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-700 border-purple-300 shadow-purple-100',
};

export default function EndpointCard({ method, endpoint, description, authRequired = true }: EndpointCardProps) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-white to-slate-50 shadow-md hover:shadow-lg transition-shadow mb-4">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm font-mono text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">
          {endpoint}
        </code>
        {authRequired && (
          <span className="ml-auto text-xs bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 font-semibold shadow-sm">
            🔒 Auth Required
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
