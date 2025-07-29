

import React, { useState, useCallback, useRef, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import ResultsGrid from './components/ResultsGrid';
import EmbedLinkModal from './components/EmbedLinkModal';
import ContinueWatchingGrid from './components/ContinueWatchingGrid';
import UpdateFromLink from './components/UpdateFromLink';
import ConfirmationModal from './components/ConfirmationModal';
import HowToUseGuide from './components/HowToUseGuide';
import { searchMulti, getTvDetails, getMovieDetails, getSeasonDetails, getImages } from './services/tmdb';
import { getContinueWatchingList, saveToContinueWatching, removeFromContinueWatching } from './services/storage';
import type { SearchResult, WatchProgressItem, WatchProgress, TVSearchResult, Episode, MovieSearchResult } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'how-to-use'>('home');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<WatchProgress | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchBarKey, setSearchBarKey] = useState(Date.now());
  const [continueWatchingList, setContinueWatchingList] = useState<WatchProgressItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    itemToAdd: SearchResult | null;
    progressToAdd: WatchProgress | null;
    episodeDetails: Episode | null;
    onConfirm: () => void;
  }>({
    isOpen: false,
    itemToAdd: null,
    progressToAdd: null,
    episodeDetails: null,
    onConfirm: () => {},
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setContinueWatchingList(getContinueWatchingList());
  }, []);

  useEffect(() => {
    if (feedback) {
        const timer = setTimeout(() => setFeedback(null), 4000);
        return () => clearTimeout(timer);
    }
  }, [feedback]);


  const refreshContinueWatchingList = () => {
    setContinueWatchingList(getContinueWatchingList());
  };

  const handleSearch = useCallback(async (query: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSubmittedQuery(query);

    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const searchResults = await searchMulti(query, controller.signal);
      if (!controller.signal.aborted) {
        setResults(searchResults);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
          setResults([]);
        }
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleSelectFromSearch = (item: SearchResult) => {
    setSelectedProgress(undefined);
    setSelectedItem(item);
  };

  const handleSelectFromContinueWatching = (item: WatchProgressItem) => {
    setSelectedProgress(item.progress);
    setSelectedItem(item.media);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setSelectedProgress(undefined);
  };

  const handleCloseConfirmation = () => {
    setConfirmationState({ isOpen: false, itemToAdd: null, progressToAdd: null, episodeDetails: null, onConfirm: () => {} });
  };

  const handleSaveProgress = (item: SearchResult, progress: WatchProgress, cleanPosterPath: string | null) => {
    saveToContinueWatching(item, progress, cleanPosterPath);
    refreshContinueWatchingList();
  };

  const handleRemoveProgress = (id: number, media_type: 'movie' | 'tv') => {
    removeFromContinueWatching(id, media_type);
    refreshContinueWatchingList();
  };

  const handleUpdateFromLink = async (url: string) => {
    const tvRegex = /vidfast\.pro\/tv\/(\d+)\/(\d+)\/(\d+)/;
    const movieRegex = /vidfast\.pro\/movie\/(\d+)/;

    const tvMatch = url.match(tvRegex);
    if (tvMatch) {
        const [, id, season, episode] = tvMatch;
        const mediaId = Number(id);
        const itemToUpdate = continueWatchingList.find(i => i.media.id === mediaId && i.media.media_type === 'tv');
        
        if (itemToUpdate) {
            const newProgress = { season: Number(season), episode: Number(episode) };
            saveToContinueWatching(itemToUpdate.media, newProgress, itemToUpdate.cleanPosterPath || itemToUpdate.media.poster_path);
            refreshContinueWatchingList();
            if (itemToUpdate.media.media_type === 'tv') {
                setFeedback(`'${itemToUpdate.media.name}' progress updated to S${newProgress.season} E${newProgress.episode}.`);
            }
        } else {
            try {
              const tvDetails = await getTvDetails(mediaId);
              const seasonDetails = await getSeasonDetails(mediaId, Number(season));
              const episodeDetails = seasonDetails.episodes.find(ep => ep.episode_number === Number(episode));

              const images = await getImages(mediaId, 'tv');
              const textlessPoster = images.posters.find(p => p.iso_639_1 === null);
              const posterToSave = textlessPoster?.file_path || images.posters[0]?.file_path || tvDetails.poster_path;

              const newProgress = { season: Number(season), episode: Number(episode) };
              
              const newItem: TVSearchResult = {
                  id: tvDetails.id,
                  name: tvDetails.name,
                  original_name: tvDetails.original_name,
                  media_type: 'tv',
                  poster_path: tvDetails.poster_path,
                  overview: tvDetails.overview,
                  popularity: tvDetails.popularity,
                  backdrop_path: tvDetails.backdrop_path,
                  first_air_date: tvDetails.first_air_date,
              };

              setConfirmationState({
                  isOpen: true,
                  itemToAdd: newItem,
                  progressToAdd: newProgress,
                  episodeDetails: episodeDetails || null,
                  onConfirm: () => {
                      saveToContinueWatching(newItem, newProgress, posterToSave);
                      refreshContinueWatchingList();
                      setFeedback(`Added '${tvDetails.name}' to Continue Watching.`);
                      handleCloseConfirmation();
                  }
              });
            } catch (err) {
                console.error(err);
                setFeedback("Could not find details for the TV show in the link.");
            }
        }
        return;
    }

    const movieMatch = url.match(movieRegex);
    if (movieMatch) {
        const [, id] = movieMatch;
        const mediaId = Number(id);
        const itemToUpdate = continueWatchingList.find(i => i.media.id === mediaId && i.media.media_type === 'movie');

        if (itemToUpdate) {
            saveToContinueWatching(itemToUpdate.media, {}, itemToUpdate.cleanPosterPath || itemToUpdate.media.poster_path); // Resaves to update timestamp
            refreshContinueWatchingList();
            if (itemToUpdate.media.media_type === 'movie') {
                setFeedback(`'${itemToUpdate.media.title}' has been moved to the front of your list.`);
            }
        } else {
            try {
              const movieDetails = await getMovieDetails(mediaId);
              const images = await getImages(mediaId, 'movie');
              const textlessPoster = images.posters.find(p => p.iso_639_1 === null);
              const posterToSave = textlessPoster?.file_path || images.posters[0]?.file_path || movieDetails.poster_path;

              setConfirmationState({
                  isOpen: true,
                  itemToAdd: movieDetails,
                  progressToAdd: {},
                  episodeDetails: null,
                  onConfirm: () => {
                      saveToContinueWatching(movieDetails, {}, posterToSave);
                      refreshContinueWatchingList();
                      setFeedback(`Added '${movieDetails.title}' to Continue Watching.`);
                      handleCloseConfirmation();
                  }
              });
            } catch (err) {
              console.error(err);
              setFeedback("Could not find details for the movie in the link.");
            }
        }
        return;
    }

    setFeedback('Invalid or unrecognized VidFast link format.');
  };


  const handleGoHome = useCallback(() => {
    abortControllerRef.current?.abort();
    setSubmittedQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
    setSelectedItem(null);
    setIsLoading(false);
    setSearchBarKey(Date.now());
    setView('home');
  }, []);

  const isItemSelectedAndSaved = selectedItem ? continueWatchingList.some(i => i.media.id === selectedItem.id && i.media.media_type === selectedItem.media_type) : false;

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="py-8 px-4 text-center">
        <h1
          className="text-6xl md:text-7xl font-heading tracking-wider text-netflix-red uppercase cursor-pointer hover:text-netflix-red-dark transition-colors duration-300"
          onClick={handleGoHome}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleGoHome();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="VidFast Link Generator, Go to homepage"
        >
          VidFast Link Generator
        </h1>
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto mt-2">
            Quickly find any movie or TV show and generate a direct VidFast streaming link.
        </p>
         <button
          onClick={() => setView('how-to-use')}
          className="text-netflix-red hover:underline mt-2 text-md"
        >
          How to use this site
        </button>
      </header>
      
      {view === 'home' && (
        <div className="sticky top-0 z-10 py-4 bg-black/80 backdrop-blur-sm">
            <div className="container mx-auto px-4">
            <SearchBar 
                key={searchBarKey}
                onSearch={handleSearch} 
                isLoading={isLoading} 
            />
            </div>
        </div>
      )}

      <main className="container mx-auto px-4 pb-16">
        {view === 'how-to-use' ? (
            <HowToUseGuide onGoBack={() => setView('home')} />
        ) : (
            <>
                {hasSearched ? (
                    // Search Results View
                    <div className="mt-8">
                        {isLoading && !results.length && (
                        <div className="flex justify-center items-center py-16" aria-label="Loading content">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
                        </div>
                        )}
                        {!isLoading && error && (
                        <p className="text-center text-red-400 text-lg py-16" role="alert">{error}</p>
                        )}
                        {results.length > 0 && (
                        <ResultsGrid results={results} onSelect={handleSelectFromSearch} />
                        )}
                        {!isLoading && !error && hasSearched && results.length === 0 && (
                        <p className="text-center text-neutral-500 text-lg py-16">No results found for "{submittedQuery}".</p>
                        )}
                    </div>
                ) : (
                    // Home Screen View
                    <div className="mt-4">
                        {continueWatchingList.length > 0 ? (
                            <ContinueWatchingGrid 
                                items={continueWatchingList} 
                                onSelect={handleSelectFromContinueWatching}
                                onRemove={handleRemoveProgress}
                            />
                        ) : (
                            !isLoading && !error && (
                                <div className="text-center text-neutral-500 mb-64">
                                    <h2 className="text-2xl font-semibold mb-2 text-white">Welcome!</h2>
                                    <p className="text-lg">Start by searching for a movie or TV show above.</p>
                                </div>
                            )
                        )}
                        {/* Always show the update from link component on the home screen */}
                        <UpdateFromLink onUpdate={handleUpdateFromLink} />
                    </div>
                )}
            </>
        )}
      </main>

      {selectedItem && (
        <EmbedLinkModal 
          item={selectedItem} 
          onClose={handleCloseModal}
          onSave={handleSaveProgress}
          onRemove={handleRemoveProgress}
          onUpdateFromLink={handleUpdateFromLink}
          setFeedback={setFeedback}
          isSaved={isItemSelectedAndSaved}
          initialProgress={selectedProgress}
        />
      )}

      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        item={confirmationState.itemToAdd}
        progress={confirmationState.progressToAdd}
        episodeDetails={confirmationState.episodeDetails}
        onConfirm={confirmationState.onConfirm}
        onCancel={handleCloseConfirmation}
      />

      {feedback && (
        <div 
            className="fixed bottom-5 right-5 bg-neutral-800 border border-neutral-600 text-white p-4 rounded-lg shadow-2xl z-50 animate-fade-in-up"
            role="alert"
        >
            {feedback}
        </div>
      )}
    </div>
  );
};

export default App;
