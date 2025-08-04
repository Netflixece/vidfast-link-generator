import React, { useState, useEffect } from 'react';
import { getTrending, getPopularMovies, getTopRatedTvShows } from '../services/tmdb';
import type { SearchResult, WatchProgressItem } from '../types';
import { useAppContext } from '../contexts/AppContext';
import ContinueWatchingGrid from '../components/ContinueWatchingGrid';
import UpdateFromLink, { UpdateFromLinkProps } from '../components/UpdateFromLink';
import ContentCarousel from '../components/ContentCarousel';
import SkeletonCarousel from '../components/SkeletonCarousel';
import { FilmIcon, TvIcon } from '../components/Icons';

interface HomePageProps {
    onSelectCategory: (category: 'movies' | 'tv-shows') => void;
    onSelect: (item: SearchResult) => void;
    onSelectFromContinueWatching: (item: WatchProgressItem) => void;
    linkProps: Omit<UpdateFromLinkProps, 'variant'>;
}

const CategoryButtons: React.FC<{onSelectCategory: (category: 'movies' | 'tv-shows') => void}> = ({onSelectCategory}) => (
    <div className="my-10 flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in">
        <button
            onClick={() => onSelectCategory('movies')}
            className="group flex items-center justify-center w-64 h-24 bg-neutral-900/50 border-2 border-neutral-800 rounded-lg text-white text-2xl font-bold hover:bg-neutral-800 hover:border-netflix-red transition-all duration-300 transform hover:scale-105"
        >
            <FilmIcon className="w-8 h-8 mr-4 text-neutral-400 group-hover:text-netflix-red transition-colors" />
            Movies
        </button>
        <button
            onClick={() => onSelectCategory('tv-shows')}
            className="group flex items-center justify-center w-64 h-24 bg-neutral-900/50 border-2 border-neutral-800 rounded-lg text-white text-2xl font-bold hover:bg-neutral-800 hover:border-netflix-red transition-all duration-300 transform hover:scale-105"
        >
            <TvIcon className="w-8 h-8 mr-4 text-neutral-400 group-hover:text-netflix-red transition-colors" />
            TV Shows
        </button>
    </div>
);


const HomePage: React.FC<HomePageProps> = ({ onSelectCategory, onSelect, onSelectFromContinueWatching, linkProps }) => {
    const { continueWatchingList, myList, toggleMyListItem } = useAppContext();
    const [trending, setTrending] = useState<SearchResult[]>([]);
    const [popularMovies, setPopularMovies] = useState<SearchResult[]>([]);
    const [topRatedTv, setTopRatedTv] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const fetchHomepageContent = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [trendingRes, popularMoviesRes, topRatedTvRes] = await Promise.all([
                    getTrending(controller.signal),
                    getPopularMovies(controller.signal),
                    getTopRatedTvShows(controller.signal)
                ]);
                if (!controller.signal.aborted) {
                    setTrending(trendingRes);
                    setPopularMovies(popularMoviesRes);
                    setTopRatedTv(topRatedTvRes);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    console.error("Failed to fetch homepage content:", err);
                    setError("Could not load discovery sections. Please try again later.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchHomepageContent();
        
        return () => controller.abort();
    }, []);

    if (isLoading) {
        return (
            <div className="mt-4 space-y-4">
                <SkeletonCarousel />
                <SkeletonCarousel />
                <SkeletonCarousel />
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-red-400 text-lg py-16" role="alert">{error}</p>;
    }

    if (continueWatchingList.length > 0) {
        // Returning User Layout
        return (
            <div className="mt-4">
                <ContinueWatchingGrid onSelect={onSelectFromContinueWatching} />
                <UpdateFromLink {...linkProps} />
                <CategoryButtons onSelectCategory={onSelectCategory} />
                <div className="space-y-4">
                    {myList.length > 0 && <ContentCarousel title="My List" items={myList.map(i => i.media)} onSelect={onSelect} onRemoveItem={toggleMyListItem} />}
                    {trending.length > 0 && <ContentCarousel title="Trending This Week" items={trending} onSelect={onSelect} />}
                    {popularMovies.length > 0 && <ContentCarousel title="Popular Movies" items={popularMovies} onSelect={onSelect} />}
                    {topRatedTv.length > 0 && <ContentCarousel title="Top Rated TV Shows" items={topRatedTv} onSelect={onSelect} />}
                </div>
            </div>
        );
    } else {
        // New User Layout
        return (
            <div className="mt-4">
                <div className="max-w-4xl mx-auto bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 md:p-12 my-8 text-center animate-fade-in">
                    <div className="flex justify-center items-center space-x-4 text-neutral-800 mb-8">
                        <FilmIcon className="w-16 h-16 opacity-80 -rotate-12"/>
                        <TvIcon className="w-20 h-20 opacity-90 rotate-6"/>
                    </div>
                    <h2 className="text-4xl font-bold mb-3 text-white">Welcome to VidFast</h2>
                    <div className="mb-8">
                        <p className="text-xl font-medium text-neutral-100">Your list is currently empty.</p>
                        <p className="text-lg text-neutral-400 mt-2">Get started by searching, browsing the sections below, or pasting a VidFast link to add to your list.</p>
                    </div>
                    <UpdateFromLink {...linkProps} variant="compact" />
                </div>
                <CategoryButtons onSelectCategory={onSelectCategory} />
                <div className="space-y-4">
                    {myList.length > 0 && <ContentCarousel title="My List" items={myList.map(i => i.media)} onSelect={onSelect} onRemoveItem={toggleMyListItem} />}
                    {trending.length > 0 && <ContentCarousel title="Trending This Week" items={trending} onSelect={onSelect} />}
                    {popularMovies.length > 0 && <ContentCarousel title="Popular Movies" items={popularMovies} onSelect={onSelect} />}
                    {topRatedTv.length > 0 && <ContentCarousel title="Top Rated TV Shows" items={topRatedTv} onSelect={onSelect} />}
                </div>
            </div>
        );
    }
};

export default HomePage;
