
import React from 'react';
import type { WatchProgressItem } from '../types';
import ContinueWatchingCard from './ContinueWatchingCard';

interface ContinueWatchingGridProps {
  items: WatchProgressItem[];
  onSelect: (item: WatchProgressItem) => void;
  onRemove: (id: number, media_type: 'movie' | 'tv') => void;
  playerTheme: string;
}

const ContinueWatchingGrid: React.FC<ContinueWatchingGridProps> = ({ items, onSelect, onRemove, playerTheme }) => {
  return (
    <div>
        <h2 className="text-2xl tracking-wider text-white mb-6">Continue Watching</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {items.filter(item => item && item.media).map((item, index) => (
            <div
              key={`${item.media.media_type}-${item.media.id}`}
              className="opacity-0 animate-fade-in-up"
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
    </div>
  );
};

export default ContinueWatchingGrid;
