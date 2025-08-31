'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showResultsInfo?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalResults,
  itemsPerPage,
  onPageChange,
  showResultsInfo = true,
  className = ""
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalResults);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showResultsInfo && (
        <div className="text-sm text-gray-600">
          Showing {startIndex}-{endIndex} of {totalResults} results
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {(() => {
            const pages = [];
            const maxVisiblePages = 7;
            
            if (totalPages <= maxVisiblePages) {
              // Show all pages if total is small
              for (let i = 1; i <= totalPages; i++) {
                pages.push(
                  <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(i)}
                    className="w-8 h-8 p-0 cursor-pointer"
                  >
                    {i}
                  </Button>
                );
              }
            } else {
              // Show first page
              pages.push(
                <Button
                  key={1}
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(1)}
                  className="w-8 h-8 p-0 cursor-pointer"
                >
                  1
                </Button>
              );
              
              // Show ellipsis if needed before current page
              if (currentPage > 3) {
                pages.push(
                  <span key="ellipsis1" className="px-2 text-gray-500">
                    ...
                  </span>
                );
              }
              
              // Show pages around current page
              const startPage = Math.max(2, currentPage - 1);
              const endPage = Math.min(totalPages - 1, currentPage + 1);
              
              for (let i = startPage; i <= endPage; i++) {
                if (i !== 1 && i !== totalPages) {
                  pages.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(i)}
                      className="w-8 h-8 p-0 cursor-pointer"
                    >
                      {i}
                    </Button>
                  );
                }
              }
              
              // Show ellipsis if needed after current page
              if (currentPage < totalPages - 2) {
                pages.push(
                  <span key="ellipsis2" className="px-2 text-gray-500">
                    ...
                  </span>
                );
              }
              
              // Show last page
              if (totalPages > 1) {
                pages.push(
                  <Button
                    key={totalPages}
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    className="w-8 h-8 p-0 cursor-pointer"
                  >
                    {totalPages}
                  </Button>
                );
              }
            }
            
            return pages;
          })()}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="cursor-pointer"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
