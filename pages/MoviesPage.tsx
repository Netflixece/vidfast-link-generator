import React, { useState, useEffect } from 'react';
import { getPopularMovies, getTopRatedMovies, getUpcomingMovies } from '../services/tmdb';
import type { SearchResult } from '../types';
import ContentCarousel from '../components/ContentCarousel';
import SkeletonCarousel from '../components/SkeletonCarousel';

interface MoviesPageProps {
    onSelect: (item: SearchResult) => void;
}

const MoviesPage: React.FC<MoviesPageProps> = ({ onSelect }) => {
    const [popular, setPopular] = useState<SearchResult[]>([]);
    const [topRated, setTopRated] = useState<SearchResult[]>([]);
    const [upcoming, setUpcoming] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const fetchMovies = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [popularRes, topRatedRes, upcomingRes] = await Promise.all([
                    getPopularMovies(controller.signal),
                    getTopRatedMovies(controller.signal),
                    getUpcomingMovies(controller.signal)
                ]);
                if (!controller.signal.aborted) {
                    setPopular(popularRes);
                    setTopRated(topRatedRes);
                    setUpcoming(upcomingRes);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError("Could not load movie sections. Please try again later.");
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };
        fetchMovies();
        return () => controller.abort();
    }, []);

    const carousels = [
        { title: "Popular Movies", items: popular },
        { title: "Top Rated Movies", items: topRated },
        { title: "Upcoming Movies", items: upcoming },
    ];

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h2 className="text-4xl font-bold tracking-wider text-white">Movies</h2>
                <p className="text-neutral-400 mt-1">Browse movies by popular categories.</p>
            </div>
            {isLoading && (
                <div className="mt-4 space-y-4">
                    <SkeletonCarousel />
                    <SkeletonCarousel />
                    <SkeletonCarousel />
                </div>
            )}
            {error && <p className="text-center text-red-400 text-lg py-16" role="alert">{error}</p>}
            {!isLoading && !error && (
                <div className="space-y-4">
                    {carousels.map(carousel => (
                        <ContentCarousel key={carousel.title} title={carousel.title} items={carousel.items} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MoviesPage;
