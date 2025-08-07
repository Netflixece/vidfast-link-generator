import React, { useState, useEffect } from 'react';
import { getPopularTvShows, getTopRatedTvShows, getOnTheAirTvShows } from '../services/tmdb';
import type { SearchResult } from '../types';
import ContentCarousel from '../components/ContentCarousel';
import SkeletonCarousel from '../components/SkeletonCarousel';

interface TvShowsPageProps {
    onSelect: (item: SearchResult) => void;
}

const TvShowsPage: React.FC<TvShowsPageProps> = ({ onSelect }) => {
    const [popular, setPopular] = useState<SearchResult[]>([]);
    const [topRated, setTopRated] = useState<SearchResult[]>([]);
    const [onTheAir, setOnTheAir] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const fetchTvShows = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [popularRes, topRatedRes, onTheAirRes] = await Promise.all([
                    getPopularTvShows(controller.signal),
                    getTopRatedTvShows(controller.signal),
                    getOnTheAirTvShows(controller.signal)
                ]);
                if (!controller.signal.aborted) {
                    setPopular(popularRes);
                    setTopRated(topRatedRes);
                    setOnTheAir(onTheAirRes);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError("Could not load TV show sections. Please try again later.");
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };
        fetchTvShows();
        return () => controller.abort();
    }, []);

    const carousels = [
        { title: "Popular TV Shows", items: popular },
        { title: "Top Rated TV Shows", items: topRated },
        { title: "Currently On The Air", items: onTheAir },
    ];

    return (
        <div className="animate-fade-in pt-6">
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

export default TvShowsPage;
