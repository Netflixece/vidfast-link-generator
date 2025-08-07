

import React from 'react';
import type { SearchResult } from '../types';
import ResultCard from './ResultCard';

interface ResultsGridProps {
  results: SearchResult[];
  onSelect: (item: SearchResult) => void;
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ results, onSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {results.map((item, index) => (
        <div
          key={`${item.media_type}-${item.id}`}
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: `${index * 75}ms` }}
        >
          <ResultCard item={item} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
};

export default ResultsGrid;
