
import React from 'react';
import type { WatchProgressItem } from '../types';
import ContinueWatchingCard from './ContinueWatchingCard';

interface ContinueWatchingGridProps {
  items: WatchProgressItem[];
  onSelect: (item: WatchProgressItem) => void;
  onRemove: (id: number, media_type: 'movie' | 'tv') => void;
}

const ContinueWatchingGrid: React.FC<ContinueWatchingGridProps> = ({ items, onSelect, onRemove }) => {
  return (
    <div>
        <h2 className="text-3xl font-heading tracking-wider text-white mb-6">Continue Watching</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {items.map((item) => (
            <ContinueWatchingCard 
                key={`${item.media.media_type}-${item.media.id}`} 
                item={item} 
                onSelect={onSelect}
                onRemove={onRemove} 
            />
          ))}
        </div>
    </div>
  );
};

export default ContinueWatchingGrid;
