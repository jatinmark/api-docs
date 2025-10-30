import { ReactNode } from 'react';
import { Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children: ReactNode;
}

const styles = {
  info: {
    container: 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 text-cyan-900',
    icon: 'text-cyan-600',
    Icon: Info,
  },
  warning: {
    container: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900',
    icon: 'text-amber-600',
    Icon: AlertTriangle,
  },
  success: {
    container: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900',
    icon: 'text-emerald-600',
    Icon: CheckCircle,
  },
  danger: {
    container: 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 text-rose-900',
    icon: 'text-rose-600',
    Icon: AlertCircle,
  },
};

export default function Callout({ type = 'info', title, children }: CalloutProps) {
  const style = styles[type];
  const Icon = style.Icon;

  return (
    <div className={`border rounded-xl p-4 ${style.container} shadow-sm`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
        <div className="flex-1">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
