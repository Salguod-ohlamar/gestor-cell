import React, { useRef } from 'react';
import { ArrowUp, ArrowDown, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({
  columns,
  data,
  sortConfig,
  onSort,
  renderRow,
  currentPage,
  totalPages,
  onPageChange,
  onColumnOrderChange,
  noResultsMessage = "Nenhum item encontrado.",
}) => {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.currentTarget.classList.add('bg-gray-300', 'dark:bg-gray-700');
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('bg-gray-300', 'dark:bg-gray-700');
    const newColumns = [...columns];
    const draggedItemContent = newColumns.splice(dragItem.current, 1)[0];
    newColumns.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    if (onColumnOrderChange) {
      onColumnOrderChange(newColumns);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={col.id}
                  className={`p-4 font-semibold text-${col.align} ${col.sortable ? 'cursor-pointer' : 'cursor-move'} group ${col.printable === false ? 'printable-hidden' : ''}`}
                  draggable={!!onColumnOrderChange}
                  onDragStart={(e) => onColumnOrderChange && handleDragStart(e, index)}
                  onDragEnter={(e) => onColumnOrderChange && handleDragEnter(e, index)}
                  onDragEnd={(e) => onColumnOrderChange && handleDragEnd(e)}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2">
                    {onColumnOrderChange && <GripVertical size={16} className="text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    {col.sortable ? (
                      <button onClick={() => onSort(col.id)} className="flex items-center hover:text-green-600 dark:hover:text-green-400 transition-colors">
                        {col.label}
                        {sortConfig.key === col.id && (sortConfig.direction === 'ascending' ? <ArrowUp size={16} className="ml-2" /> : <ArrowDown size={16} className="ml-2" />)}
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map(item => renderRow(item, columns)) : (
              <tr><td colSpan={columns.length} className="p-8 text-center text-gray-500">{noResultsMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center no-print text-sm text-gray-500 dark:text-gray-400">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => onPageChange(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;