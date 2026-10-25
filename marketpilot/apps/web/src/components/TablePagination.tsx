import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemName = 'entries'
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const effectiveSizes = Array.from(new Set([pageSize, ...pageSizeOptions, 10, 15, 20, 25, 50, 100]))
    .filter(Boolean)
    .sort((a, b) => a - b);

  const pageSizeSelectOptions = effectiveSizes.map(sz => ({
    value: String(sz),
    label: `${sz} / page`
  }));

  return (
    <div className="table-pagination-bar">
      {/* Left: Summary text */}
      <div className="pagination-summary">
        Showing <strong>{startItem}</strong> – <strong>{endItem}</strong> of <strong>{totalItems}</strong> {itemName}
      </div>

      {/* Center/Right: Rows per page + Page controls */}
      <div className="pagination-controls">
        {onPageSizeChange && (
          <div className="page-size-picker">
            <span className="page-size-label">Rows:</span>
            <CustomSelect
              value={String(pageSize)}
              onChange={(val) => {
                onPageSizeChange(Number(val));
                onPageChange(1);
              }}
              options={pageSizeSelectOptions}
              className="page-size-select"
            />
          </div>
        )}

        <div className="pagination-buttons">
          {/* First page */}
          <button
            type="button"
            className="pagination-btn icon-only"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            title="First page"
            aria-label="First page"
          >
            <ChevronsLeft size={15} />
          </button>

          {/* Previous page */}
          <button
            type="button"
            className="pagination-btn icon-only"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Page numbers */}
          <div className="page-numbers-group">
            {pageNumbers.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                    …
                  </span>
                );
              }
              const pageNum = p as number;
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`pagination-btn number-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next page */}
          <button
            type="button"
            className="pagination-btn icon-only"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>

          {/* Last page */}
          <button
            type="button"
            className="pagination-btn icon-only"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last page"
            aria-label="Last page"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
