
import React from 'react';
import type { SearchResult } from '../types';
import ResultCard from './ResultCard';

interface ResultsGridProps {
  results: SearchResult[];
  onSelect: (item: SearchResult) => void;
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ results, onSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {results.map((item) => (
        <ResultCard key={`${item.media_type}-${item.id}`} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
};

export default ResultsGrid;
