import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  id?: string;
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  emptyMessage?: string;
  keyExtractor: (item: T) => string | number;
}

export function Table<T>({
  id = 'table',
  data,
  columns,
  pageSize = 8,
  emptyMessage = 'Nenhum registro encontrado.',
  keyExtractor
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  
  // Safe page index correction
  const safePage = Math.min(currentPage, totalPages);
  
  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div id={id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs flex flex-col">
      <div className="overflow-x-auto w-full">
        {data.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <Inbox size={32} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold">{emptyMessage}</p>
            <p className="text-xs text-slate-400 mt-1">Nenhum dado cadastrado para exibição.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                {columns.map((col, index) => (
                  <th key={index} className={`py-3.5 px-6 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedData.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-slate-50/40 transition-colors">
                  {columns.map((col, index) => (
                    <td key={index} className={`py-4 px-6 text-slate-700 font-medium ${col.className || ''}`}>
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination component */}
      {data.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs bg-white">
          <span className="text-slate-400 font-mono">
            Exibindo <strong className="text-slate-700 font-semibold">{Math.min(startIndex + 1, data.length)}</strong> a <strong className="text-slate-700 font-semibold">{Math.min(startIndex + pageSize, data.length)}</strong> de <strong className="text-slate-700 font-semibold">{data.length}</strong> registros
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={safePage === 1}
              className="p-1.5 border border-slate-150 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-slate-500 px-2">
              Pág <strong className="text-slate-700">{safePage}</strong> de <strong className="text-slate-700">{totalPages}</strong>
            </span>
            <button
              onClick={handleNextPage}
              disabled={safePage === totalPages}
              className="p-1.5 border border-slate-150 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
