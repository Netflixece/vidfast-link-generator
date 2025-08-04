
import { TMDB_API_KEY, TMDB_API_BASE_URL } from '../constants';
import type { TMDBResponse, SearchResult, TVDetails, MovieSearchResult, SeasonDetails, ImagesResponse, TVSearchResult } from '../types';

const fetchFromTMDB = async (path: string, params: Record<string, string> = {}, signal?: AbortSignal) => {
    const url = new URL(`${TMDB_API_BASE_URL}${path}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), { signal });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ status_message: 'An unknown error occurred' }));
        throw new Error(errorData.status_message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const searchMulti = async (query: string, signal?: AbortSignal): Promise<SearchResult[]> => {
  const data: TMDBResponse = await fetchFromTMDB('/search/multi', { query }, signal);
  return data.results.filter(
    (item): item is SearchResult => item.media_type === 'movie' || item.media_type === 'tv'
  ).sort((a,b) => b.popularity - a.popularity);
};

export const getTrending = async (signal?: AbortSignal): Promise<SearchResult[]> => {
    const data: TMDBResponse = await fetchFromTMDB('/trending/all/week', {}, signal);
    return data.results.filter(
      (item): item is SearchResult => (item.media_type === 'movie' || item.media_type === 'tv')
    );
};

export const getPopularMovies = async (signal?: AbortSignal): Promise<MovieSearchResult[]> => {
    const data = await fetchFromTMDB('/movie/popular', {}, signal);
    return data.results.map((movie: any) => ({ ...movie, media_type: 'movie' }));
};

export const getTopRatedMovies = async (signal?: AbortSignal): Promise<MovieSearchResult[]> => {
    const data = await fetchFromTMDB('/movie/top_rated', {}, signal);
    return data.results.map((movie: any) => ({ ...movie, media_type: 'movie' }));
};

export const getUpcomingMovies = async (signal?: AbortSignal): Promise<MovieSearchResult[]> => {
    const data = await fetchFromTMDB('/movie/upcoming', {}, signal);
    return data.results.map((movie: any) => ({ ...movie, media_type: 'movie' }));
};


export const getPopularTvShows = async (signal?: AbortSignal): Promise<TVSearchResult[]> => {
    const data = await fetchFromTMDB('/tv/popular', {}, signal);
    return data.results.map((tvShow: any) => ({ ...tvShow, media_type: 'tv' }));
};

export const getTopRatedTvShows = async (signal?: AbortSignal): Promise<TVSearchResult[]> => {
    const data = await fetchFromTMDB('/tv/top_rated', {}, signal);
    return data.results.map((tvShow: any) => ({ ...tvShow, media_type: 'tv' }));
};

export const getOnTheAirTvShows = async (signal?: AbortSignal): Promise<TVSearchResult[]> => {
    const data = await fetchFromTMDB('/tv/on_the_air', {}, signal);
    return data.results.map((tvShow: any) => ({ ...tvShow, media_type: 'tv' }));
};

export const getTvDetails = async (id: number, signal?: AbortSignal): Promise<TVDetails> => {
  return fetchFromTMDB(`/tv/${id}`, {}, signal);
};

export const getMovieDetails = async (id: number, signal?: AbortSignal): Promise<MovieSearchResult> => {
    const movie = await fetchFromTMDB(`/movie/${id}`, {}, signal);
    // Ensure media_type is present for consistency
    return { ...movie, media_type: 'movie' };
};

export const getSeasonDetails = async (tvId: number, seasonNumber: number, signal?: AbortSignal): Promise<SeasonDetails> => {
    return fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`, {}, signal);
};

export const getImages = async (mediaId: number, mediaType: 'movie' | 'tv', signal?: AbortSignal): Promise<ImagesResponse> => {
    // By including 'null' in include_image_language, we can fetch posters without text.
    return fetchFromTMDB(`/${mediaType}/${mediaId}/images`, { include_image_language: 'en,null' }, signal);
};
