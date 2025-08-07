
import React, { useRef, useState, useLayoutEffect } from 'react';
import type { SearchResult } from '../types';
import ResultCard from './ResultCard';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface ContentCarouselProps {
  title: string;
  items: SearchResult[];
  onSelect: (item: SearchResult) => void;
  onRemoveItem?: (item: SearchResult) => void;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({ title, items, onSelect, onRemoveItem }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

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
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.offsetWidth * 0.8; // scroll by 80% of the visible width
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold tracking-wider text-white mb-4">{title}</h2>
      <div className="relative group/nav">
        <button
          onClick={() => scroll('left')}
          className={`absolute -left-1 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/20 transition-all opacity-0 disabled:opacity-0 ${showArrows ? 'group-hover/nav:opacity-100' : 'pointer-events-none'}`}
          aria-label="Scroll left"
          disabled={!showArrows}
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto space-x-6 py-4 scrollbar-hide"
        >
          {items.map((item, index) => (
            <div
              key={`${item.media_type}-${item.id}`}
              className="w-40 sm:w-48 md:w-52 flex-shrink-0 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ResultCard item={item} onSelect={onSelect} onRemove={onRemoveItem} />
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/20 transition-all opacity-0 disabled:opacity-0 ${showArrows ? 'group-hover/nav:opacity-100' : 'pointer-events-none'}`}
          aria-label="Scroll right"
          disabled={!showArrows}
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default ContentCarousel;
