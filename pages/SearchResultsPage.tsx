import React from 'react';
import type { SearchResult } from '../types';
import ResultsGrid from '../components/ResultsGrid';
import SkeletonGrid from '../components/SkeletonGrid';

interface SearchResultsPageProps {
    submittedQuery: string;
    results: SearchResult[];
    isLoading: boolean;
    error: string | null;
    onSelect: (item: SearchResult) => void;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ submittedQuery, results, isLoading, error, onSelect }) => {
    if (isLoading && results.length === 0) {
        return (
            <>
                <h2 className="text-2xl tracking-wider text-neutral-400 mb-6">Searching for "{submittedQuery}"...</h2>
                <SkeletonGrid />
            </>
        );
    }

    if (!isLoading && error) {
        return <p className="text-center text-red-400 text-lg py-16" role="alert">{error}</p>;
    }

    if (results.length > 0) {
        return (
            <>
                <h2 className="text-2xl tracking-wider text-white mb-6">Results for "{submittedQuery}"</h2>
                <ResultsGrid results={results} onSelect={onSelect} />
            </>
        );
    }

    if (!isLoading && !error && results.length === 0) {
        return (
            <div className="text-center text-neutral-500 text-lg py-16">
                <p>No results found for "{submittedQuery}".</p>
                <p className="text-md text-neutral-600 mt-2">Try checking the spelling or searching for a different title.</p>
            </div>
        );
    }
    
    return null;
};

export default SearchResultsPage;
