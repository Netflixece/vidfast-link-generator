import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-neutral-900/50 rounded-md overflow-hidden">
      <div className="aspect-[2/3] bg-neutral-800 animate-pulse"></div>
      <div className="p-3">
        <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2 animate-pulse"></div>
        <div className="h-3 bg-neutral-800 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
