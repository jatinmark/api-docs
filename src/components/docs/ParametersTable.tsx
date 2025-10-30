interface Parameter {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  default?: string;
}

interface ParametersTableProps {
  parameters: Parameter[];
  title?: string;
}

export default function ParametersTable({ parameters, title = "Parameters" }: ParametersTableProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {parameters.map((param, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-indigo-600 font-semibold">
                      {param.name}
                    </code>
                    {param.required && (
                      <span className="text-xs bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">
                        required
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {param.type}
                  </code>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {param.description}
                  {param.default && (
                    <div className="mt-1 text-xs text-slate-500">
                      Default: <code className="bg-slate-100 px-1 rounded">{param.default}</code>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
