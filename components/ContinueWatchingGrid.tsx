
import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import type { WatchProgressItem } from '../types';
import ContinueWatchingCard from './ContinueWatchingCard';
import { ChevronLeftIcon, ChevronRightIcon, FilterIcon } from './Icons';
import { useAppContext } from '../contexts/AppContext';

interface ContinueWatchingGridProps {
  onSelect: (item: WatchProgressItem) => void;
}

const ContinueWatchingGrid: React.FC<ContinueWatchingGridProps> = ({ onSelect }) => {
  const { continueWatchingList: items } = useAppContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [sort, setSort] = useState<'recent' | 'az'>('recent');

  const displayedItems = useMemo(() => {
    let filtered = items;
    if (filter !== 'all') {
      filtered = items.filter(item => item.media.media_type === filter);
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'az') {
        const titleA = a.media.media_type === 'movie' ? a.media.title : a.media.name;
        const titleB = b.media.media_type === 'movie' ? b.media.title : b.media.name;
        return titleA.localeCompare(titleB);
      }
      return 0; // 'recent' is the default and the list is already sorted
    });

    return sorted;
  }, [items, filter, sort]);


  useLayoutEffect(() => {
    const checkForOverflow = () => {
      if (scrollContainerRef.current) {
        const { current } = scrollContainerRef;
        const hasOverflow = current.scrollWidth > current.clientWidth;
        setShowArrows(hasOverflow);
      }
    };

    const timer = setTimeout(() => {
        checkForOverflow();
    }, 150);

    window.addEventListener('resize', checkForOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkForOverflow);
    };
  }, [displayedItems]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.offsetWidth * 0.8;
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-wider text-white">Continue Watching</h2>
            {items.length > 0 && (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <FilterIcon className="w-5 h-5 text-neutral-400" />
                        <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'all' ? 'bg-netflix-red text-white font-bold' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>All</button>
                        <button onClick={() => setFilter('movie')} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'movie' ? 'bg-netflix-red text-white font-bold' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>Movies</button>
                        <button onClick={() => setFilter('tv')} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'tv' ? 'bg-netflix-red text-white font-bold' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>TV Shows</button>
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as 'recent' | 'az')}
                        className="bg-neutral-800 border border-neutral-700 rounded-full py-1 pl-3 pr-8 text-sm text-neutral-300 focus:ring-netflix-red focus:border-netflix-red appearance-none bg-no-repeat bg-right"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.2em'
                        }}
                    >
                        <option value="recent">Sort by: Most Recent</option>
                        <option value="az">Sort by: A-Z</option>
                    </select>
                </div>
            )}
        </div>

        {displayedItems.length > 0 ? (
          <div className="relative group/nav">
              <button
                  onClick={() => scroll('left')}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full z-20 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/20 transition-all opacity-0 disabled:opacity-0 ${showArrows ? 'group-hover/nav:opacity-100' : 'pointer-events-none'}`}
                  aria-label="Scroll left"
                  disabled={!showArrows}
              >
                  <ChevronLeftIcon className="w-8 h-8" />
              </button>
              <div
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto space-x-6 py-4 scrollbar-hide"
              >
              {displayedItems.map((item, index) => (
                  <div
                      key={`${item.media.media_type}-${item.media.id}`}
                      className="w-40 sm:w-48 md:w-52 flex-shrink-0 animate-fade-in-up"
                      style={{ animationDelay: `${index * 75}ms` }}
                  >
                      <ContinueWatchingCard 
                          item={item} 
                          onSelect={onSelect}
                      />
                  </div>
              ))}
              </div>
              <button
                  onClick={() => scroll('right')}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-20 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/20 transition-all opacity-0 disabled:opacity-0 ${showArrows ? 'group-hover/nav:opacity-100' : 'pointer-events-none'}`}
                  aria-label="Scroll right"
                  disabled={!showArrows}
              >
                  <ChevronRightIcon className="w-8 h-8" />
              </button>
          </div>
        ) : (
          <div className="text-center text-neutral-500 py-10 bg-neutral-900/40 rounded-lg">
              No items match your current filter.
          </div>
        )}
    </div>
  );
};

export default ContinueWatchingGrid;
