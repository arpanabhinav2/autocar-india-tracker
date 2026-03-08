/**
 * FilterSidebar.tsx
 * UI component providing a horizontally scrolling filter bar.
 * Allows users to filter the car grid based on predefined segments and budgets.
 */
import React, { useRef } from 'react';
import { Filter, X, ChevronRight, ChevronLeft } from 'lucide-react';

export interface FilterState {
  segment: string;
  budget: string;
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const SEGMENTS = ['All', 'SUV', 'Sedan', 'Hatchback', 'EV', 'MUV'];
const BUDGETS = [
  { label: 'All Budgets', value: 'All' },
  { label: 'Under 10 Lakh', value: '0-10' },
  { label: '10 - 20 Lakh', value: '10-20' },
  { label: 'Above 20 Lakh', value: '20+' }
];

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full mb-12">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-red-500" />
        <h3 className="text-xl font-display font-bold text-white tracking-tight">Filters</h3>
      </div>
      
      <div className="relative group">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20 shadow-xl backdrop-blur-md hidden md:flex hover:bg-red-500/20 hover:text-red-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto custom-scrollbar pb-4 -mb-4 pt-1 gap-4 items-center px-0 md:px-12 scroll-smooth"
        >
          {/* Segment Pills */}
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shrink-0 shadow-inner">
            {SEGMENTS.map(segment => (
              <button
                key={segment}
                onClick={() => setFilters({ ...filters, segment })}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  filters.segment === segment 
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {segment}
              </button>
            ))}
          </div>

          <div className="w-px h-10 bg-white/10 shrink-0 hidden md:block" />

          {/* Budget Pills */}
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shrink-0 shadow-inner">
            {BUDGETS.map(budget => (
              <button
                key={budget.value}
                onClick={() => setFilters({ ...filters, budget: budget.value })}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap md:whitespace-normal ${
                  filters.budget === budget.value 
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {budget.label}
              </button>
            ))}
          </div>
          
          {/* Clear Button */}
          {(filters.segment !== 'All' || filters.budget !== 'All') && (
            <button
              onClick={() => setFilters({ segment: 'All', budget: 'All' })}
              className="px-4 py-2.5 rounded-xl font-bold text-sm text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 transition-all duration-300 shrink-0 flex items-center gap-2"
            >
               <X className="w-4 h-4" /> Clear
            </button>
          )}

        </div>
        
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20 shadow-xl backdrop-blur-md hidden md:flex hover:bg-red-500/20 hover:text-red-400"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
