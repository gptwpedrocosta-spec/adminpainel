import React from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  action,
  children
}) => {
  return (
    <div className="space-y-6">
      {/* Header bar of the specific page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-800 leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium mt-1 font-sans">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>

      {/* Main content body of the specific page */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};
