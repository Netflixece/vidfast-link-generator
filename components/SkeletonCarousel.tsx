import React from 'react';
import SkeletonCard from './SkeletonCard';

const SkeletonCarousel: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="h-8 bg-neutral-800 rounded w-1/4 mb-4 animate-pulse"></div>
      <div className="flex overflow-hidden space-x-6 pb-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="w-40 sm:w-48 md:w-52 flex-shrink-0">
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonCarousel;
