
import React from 'react';
import { ArrowUpIcon } from './Icons';

const ScrollToTopButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 p-3 bg-netflix-red text-white rounded-full shadow-lg hover:bg-netflix-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-netflix-red transition-colors animate-fade-in"
      aria-label="Scroll to top"
    >
      <ArrowUpIcon className="w-6 h-6" />
    </button>
  );
};

export default ScrollToTopButton;
