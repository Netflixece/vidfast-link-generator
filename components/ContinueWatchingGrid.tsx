
import React, { useRef, useState, useLayoutEffect } from 'react';
import type { WatchProgressItem } from '../types';
import ContinueWatchingCard from './ContinueWatchingCard';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface ContinueWatchingGridProps {
  items: WatchProgressItem[];
  onSelect: (item: WatchProgressItem) => void;
  onRemove: (id: number, media_type: 'movie' | 'tv') => void;
  playerTheme: string;
}

const ContinueWatchingGrid: React.FC<ContinueWatchingGridProps> = ({ items, onSelect, onRemove, playerTheme }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);

  useLayoutEffect(() => {
    const checkForOverflow = () => {
      if (scrollContainerRef.current) {
        const { current } = scrollContainerRef;
        const hasOverflow = current.scrollWidth > current.clientWidth;
        setShowArrows(hasOverflow);
      }
    };

    // A small timeout helps ensure the layout is settled, especially with animations.
    const timer = setTimeout(() => {
        checkForOverflow();
    }, 150);

    window.addEventListener('resize', checkForOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkForOverflow);
    };
  }, [items]);

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
        <h2 className="text-2xl font-bold tracking-wider text-white mb-6">Continue Watching</h2>
        <div className="relative group/nav">
            <button
                onClick={() => scroll('left')}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/20 transition-all opacity-0 disabled:opacity-0 ${showArrows ? 'group-hover/nav:opacity-100' : 'pointer-events-none'}`}
                aria-label="Scroll left"
                disabled={!showArrows}
            >
                <ChevronLeftIcon className="w-8 h-8" />
            </button>
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto space-x-6 py-4 scrollbar-hide"
            >
            {items.filter(item => item && item.media).map((item, index) => (
                <div
                    key={`${item.media.media_type}-${item.media.id}`}
                    className="w-40 sm:w-48 md:w-52 flex-shrink-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 75}ms` }}
                >
                    <ContinueWatchingCard 
                        item={item} 
                        onSelect={onSelect}
                        onRemove={onRemove}
                        playerTheme={playerTheme}
                    />
                </div>
            ))}
            </div>
            <button
                onClick={() => scroll('right')}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/20 transition-all opacity-0 disabled:opacity-0 ${showArrows ? 'group-hover/nav:opacity-100' : 'pointer-events-none'}`}
                aria-label="Scroll right"
                disabled={!showArrows}
            >
                <ChevronRightIcon className="w-8 h-8" />
            </button>
        </div>
    </div>
  );
};

export default ContinueWatchingGrid;
