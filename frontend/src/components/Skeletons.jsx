import React from 'react';

export const CardSkeleton = ({ className = '' }) => (
  <div className={`border border-slate-200 rounded-lg p-5 animate-pulse ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-slate-200 rounded-full w-20" />
        <div className="h-5 bg-slate-200 rounded-full w-2/3" />
      </div>
      <div className="h-8 w-20 bg-slate-200 rounded-lg" />
    </div>
    <div className="h-3 bg-slate-200 rounded-full w-full mb-2" />
    <div className="h-3 bg-slate-200 rounded-full w-5/6 mb-4" />
    <div className="grid grid-cols-2 gap-2">
      <div className="h-10 bg-slate-100 rounded-lg" />
      <div className="h-10 bg-slate-100 rounded-lg" />
    </div>
    <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
      <div className="h-3 bg-slate-200 rounded-full w-24" />
      <div className="h-8 w-20 bg-slate-200 rounded-lg" />
    </div>
  </div>
);

export const StatCardSkeleton = ({ className = '' }) => (
  <div className={`border border-slate-200 rounded-lg p-5 animate-pulse ${className}`}>
    <div className="h-3 bg-slate-200 rounded-full w-24 mb-2" />
    <div className="h-6 bg-slate-200 rounded-full w-12 mb-1.5" />
    <div className="h-3 bg-slate-100 rounded-full w-16" />
  </div>
);

export const TableRowSkeleton = ({ cols = 5, rows = 3 }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <tr key={rowIdx} className="animate-pulse">
        {Array.from({ length: cols }).map((_, colIdx) => (
          <td key={colIdx} className="px-4 py-3.5 border-b border-slate-100">
            <div className="h-4 bg-slate-200 rounded-full w-full" />
            {colIdx === 0 && <div className="h-3 bg-slate-100 rounded-full w-3/4 mt-1" />}
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const ApplicationSkeleton = () => (
  <div className="border border-slate-200 rounded-lg p-5 animate-pulse">
    <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
      <div>
        <div className="h-3 bg-slate-200 rounded-full w-20 mb-2" />
        <div className="h-5 bg-slate-200 rounded-full w-48 mb-2" />
        <div className="h-3 bg-slate-100 rounded-full w-36" />
      </div>
      <div className="h-8 w-20 bg-slate-200 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-2.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-14 bg-slate-100 rounded-lg" />
      ))}
    </div>
  </div>
);