
import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, SpinnerIcon } from './Icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [value, setValue] = useState('');
  const debounceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = window.setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="Search for movies, tv shows..."
          className="w-full pl-5 pr-14 py-3 text-lg bg-neutral-800 text-white border-2 border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red transition-colors"
          autoFocus
        />
        <div className="absolute inset-y-0 right-0 flex items-center justify-center w-14 h-full">
            {isLoading ? (
                <SpinnerIcon className="w-6 h-6 text-netflix-red" />
            ) : (
                <button
                    type="submit"
                    className="w-full h-full flex items-center justify-center text-neutral-500 hover:text-netflix-red transition-colors"
                    aria-label="Search"
                >
                    <SearchIcon className="w-6 h-6" />
                </button>
            )}
        </div>
      </div>
    </form>
  );
};

export default SearchBar;