
export interface BaseSearchResult {
  id: number;
  poster_path: string | null;
  overview: string;
  popularity: number;
  backdrop_path: string | null;
}

export interface MovieSearchResult extends BaseSearchResult {
  media_type: 'movie';
  title: string;
  release_date: string; // "YYYY-MM-DD"
  original_title: string;
}

export interface TVSearchResult extends BaseSearchResult {
  media_type: 'tv';
  name: string;
  first_air_date: string; // "YYYY-MM-DD"
  original_name: string;
}

export type SearchResult = MovieSearchResult | TVSearchResult;

export interface TMDBResponse {
  page: number;
  results: (SearchResult | { media_type: 'person' })[];
  total_pages: number;
  total_results: number;
}

export interface Season {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
}

export interface TVDetails {
    id: number;
    name: string;
    original_name: string;
    number_of_seasons: number;
    seasons: Season[];
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    popularity: number;
}

export interface WatchProgress {
    season?: number;
    episode?: number;
}

export interface WatchProgressItem {
    media: SearchResult;
    progress: WatchProgress;
    savedAt: number; // timestamp for sorting
    cleanPosterPath?: string | null;
}

export interface MyListItem {
    media: SearchResult;
    savedAt: number;
}

export interface Episode {
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    season_number: number;
    air_date: string;
}

export interface SeasonDetails {
    _id: string;
    air_date: string;
    episodes: Episode[];
    name: string;
    overview: string;
    id: number;
    poster_path: string | null;
    season_number: number;
}

export interface ImageInfo {
    aspect_ratio: number;
    height: number;
    iso_639_1: string | null;
    file_path: string;
    vote_average: number;
    vote_count: number;
    width: number;
}

export interface ImagesResponse {
    id: number;
    backdrops: ImageInfo[];
    logos: ImageInfo[];
    posters: ImageInfo[];
}

export interface ColorInfo {
    name: string;
    hex: string;
}
