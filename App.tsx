
import React, { useState, useCallback, useRef, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import ResultsGrid from './components/ResultsGrid';
import EmbedLinkModal from './components/EmbedLinkModal';
import ContinueWatchingGrid from './components/ContinueWatchingGrid';
import UpdateFromLink from './components/UpdateFromLink';
import ConfirmationModal from './components/ConfirmationModal';
import HowToUseGuide from './components/HowToUseGuide';
import ProfileMenu from './components/ProfileMenu';
import ResetConfirmationModal from './components/ResetConfirmationModal';
import ScrollToTopButton from './components/ScrollToTopButton';
import ThemeModal from './components/ThemeModal';
import { searchMulti, getTvDetails, getMovieDetails, getSeasonDetails, getImages } from './services/tmdb';
import { getContinueWatchingList, saveToContinueWatching, removeFromContinueWatching, exportContinueWatchingList, importContinueWatchingList, resetSiteData, getPlayerTheme, setPlayerTheme as savePlayerTheme } from './services/storage';
import type { SearchResult, WatchProgressItem, WatchProgress, TVSearchResult, Episode, MovieSearchResult, ColorInfo } from './types';
import { FilmIcon, TvIcon, BookOpenIcon, CloseIcon } from './components/Icons';
import { DEFAULT_THEME } from './constants';

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
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [linkUpdateStatus, setLinkUpdateStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const linkUpdateTimeoutRef = useRef<number | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [playerTheme, setPlayerTheme] = useState<ColorInfo>(DEFAULT_THEME);
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    itemToAdd: SearchResult | null;
    progressToAdd: WatchProgress | null;
    episodeDetails: Episode | null;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    itemToAdd: null,
    progressToAdd: null,
    episodeDetails: null,
    onConfirm: () => {},
    onCancel: () => {},
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setContinueWatchingList(getContinueWatchingList());
    setPlayerTheme(getPlayerTheme());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (feedback) {
        const timer = setTimeout(() => setFeedback(null), 5000); // Increased duration for better readability
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
    setConfirmationState({ isOpen: false, itemToAdd: null, progressToAdd: null, episodeDetails: null, onConfirm: () => {}, onCancel: () => {} });
  };

  const handleSaveProgress = (item: SearchResult, progress: WatchProgress, cleanPosterPath: string | null) => {
    saveToContinueWatching(item, progress, cleanPosterPath);
    refreshContinueWatchingList();
  };

  const handleRemoveProgress = (id: number, media_type: 'movie' | 'tv') => {
    removeFromContinueWatching(id, media_type);
    refreshContinueWatchingList();
  };
  
  const handleLinkInputChange = (url: string) => {
    setLinkInputValue(url);
    setLinkUpdateStatus('idle');

    if (linkUpdateTimeoutRef.current) clearTimeout(linkUpdateTimeoutRef.current);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    const validTvRegex = /vidfast\.pro\/tv\/\d+\/\d+\/\d+/;
    const movieRegex = /vidfast\.pro\/movie\/\d+/;
    const baseTvRegex = /vidfast\.pro\/tv\/\d+\/?($|\?.*)/;

    if (validTvRegex.test(trimmedUrl) || movieRegex.test(trimmedUrl) || baseTvRegex.test(trimmedUrl)) {
        linkUpdateTimeoutRef.current = window.setTimeout(() => {
            actuallyUpdateFromLink(trimmedUrl);
        }, 300);
    }
  };

  const actuallyUpdateFromLink = async (url: string) => {
    if (linkUpdateStatus === 'loading') return;
    setLinkUpdateStatus('loading');

    const tvRegex = /vidfast\.pro\/tv\/(\d+)\/(\d+)\/(\d+)/;
    const movieRegex = /vidfast\.pro\/movie\/(\d+)/;
    const baseTvRegex = /vidfast\.pro\/tv\/(\d+)\/?($|\?.*)/;

    const tvMatch = url.match(tvRegex);
    if (tvMatch) {
        const [, id, season, episode] = tvMatch;
        const mediaId = Number(id);
        const itemToUpdate = continueWatchingList.find(i => i.media.id === mediaId && i.media.media_type === 'tv');
        
        if (itemToUpdate) {
            const newProgress = { season: Number(season), episode: Number(episode) };
            saveToContinueWatching(itemToUpdate.media, newProgress, itemToUpdate.cleanPosterPath || itemToUpdate.media.poster_path);
            refreshContinueWatchingList();
            setLinkUpdateStatus('success');
            if (itemToUpdate.media.media_type === 'tv') {
                setFeedback(`'${itemToUpdate.media.name}' progress updated to S${newProgress.season} E${newProgress.episode}.`);
            }
            setTimeout(() => {
                setLinkInputValue('');
                setLinkUpdateStatus('idle');
            }, 2000);
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

              setLinkUpdateStatus('idle'); // Stop loading, keep text in box for confirmation
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
                      // Now show success animation, then clear
                      setLinkUpdateStatus('success');
                      setTimeout(() => {
                          setLinkInputValue('');
                          setLinkUpdateStatus('idle');
                      }, 2000);
                  },
                  onCancel: () => {
                      handleCloseConfirmation();
                      setLinkInputValue('');
                      setLinkUpdateStatus('idle');
                  }
              });
            } catch (err) {
                console.error(err);
                setFeedback("Could not find details for the TV show in the link.");
                setLinkUpdateStatus('idle');
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
            setLinkUpdateStatus('success');
            if (itemToUpdate.media.media_type === 'movie') {
                setFeedback(`'${itemToUpdate.media.title}' has been moved to the front of your list.`);
            }
            setTimeout(() => {
                setLinkInputValue('');
                setLinkUpdateStatus('idle');
            }, 2000);
        } else {
            try {
              const movieDetails = await getMovieDetails(mediaId);
              const images = await getImages(mediaId, 'movie');
              const textlessPoster = images.posters.find(p => p.iso_639_1 === null);
              const posterToSave = textlessPoster?.file_path || images.posters[0]?.file_path || movieDetails.poster_path;

              setLinkUpdateStatus('idle'); // Stop loading, keep text in box for confirmation
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
                      // Now show success animation, then clear
                      setLinkUpdateStatus('success');
                      setTimeout(() => {
                          setLinkInputValue('');
                          setLinkUpdateStatus('idle');
                      }, 2000);
                  },
                  onCancel: () => {
                      handleCloseConfirmation();
                      setLinkInputValue('');
                      setLinkUpdateStatus('idle');
                  }
              });
            } catch (err) {
              console.error(err);
              setFeedback("Could not find details for the movie in the link.");
              setLinkUpdateStatus('idle');
            }
        }
        return;
    }
    
    const baseTvMatch = url.match(baseTvRegex);
    if (baseTvMatch) {
        const [, id] = baseTvMatch;
        const mediaId = Number(id);
        try {
            const tvDetails = await getTvDetails(mediaId);
            setFeedback(`The link you pasted is for '${tvDetails.name}' but is missing the Season and Episode. Please paste a valid link with Season and Episode to add.`);
        } catch (err) {
            console.error("Failed to fetch TV details for base link", err);
            setFeedback("The pasted TV show link is invalid or the show could not be found.");
        }
        setLinkUpdateStatus('idle');
        return;
    }
    
    setFeedback('Invalid or unrecognized VidFast link format.');
    setLinkUpdateStatus('idle');
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

  const handleExport = () => {
    exportContinueWatchingList();
    setFeedback("Continue Watching list exported successfully.");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
            try {
                await importContinueWatchingList(text);
                refreshContinueWatchingList();
                setFeedback("List imported successfully!");
            } catch (err) {
                setFeedback(err instanceof Error ? err.message : "Failed to import list.");
            }
        }
    };
    reader.onerror = () => {
        setFeedback("Error reading the import file.");
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    resetSiteData();
    refreshContinueWatchingList();
    setPlayerTheme(DEFAULT_THEME);
    savePlayerTheme(DEFAULT_THEME);
    setIsResetModalOpen(false);
    setFeedback("Site has been reset.");
    // also clear search state
    setResults([]);
    setSubmittedQuery('');
    setHasSearched(false);
    setError(null);
    setSelectedItem(null);
    setSearchBarKey(Date.now());
  };

  const handleThemeChange = (theme: ColorInfo) => {
    setPlayerTheme(theme);
    savePlayerTheme(theme);
    setFeedback(`Player theme changed to ${theme.name}`);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isItemSelectedAndSaved = selectedItem ? continueWatchingList.some(i => i.media.id === selectedItem.id && i.media.media_type === selectedItem.media_type) : false;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="py-8 px-4 text-center relative">
        <div className="absolute top-12 right-6 md:right-10">
            <ProfileMenu
              onImport={handleImport}
              onExport={handleExport}
              onReset={handleReset}
              onThemeSelect={() => setIsThemeModalOpen(true)}
            />
        </div>
        <h1
          className="text-6xl md:text-7xl font-bold text-netflix-red uppercase cursor-pointer hover:text-netflix-red-dark transition-colors duration-300"
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
          onClick={() => view === 'how-to-use' ? handleGoHome() : setView('how-to-use')}
          className="mt-4 inline-flex items-center text-netflix-red border border-netflix-red/50 rounded-full px-5 py-2 text-md transition-colors hover:bg-netflix-red/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-netflix-red"
        >
          {view === 'how-to-use' ? (
              <>
                <CloseIcon className="w-5 h-5 mr-2" />
                Close Guide
              </>
          ) : (
              <>
                <BookOpenIcon className="w-5 h-5 mr-2" />
                Guide to use this site
              </>
          )}
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

      <main className="container mx-auto px-4 pb-16 min-h-[50vh]">
        <div key={view} className="animate-fade-in">
          {view === 'how-to-use' ? (
              <HowToUseGuide onGoBack={() => setView('home')} />
          ) : (
              <>
                  {hasSearched ? (
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
                            <>
                                <h2 className="text-2xl tracking-wider text-white mb-6">Results for "{submittedQuery}"</h2>
                                <ResultsGrid results={results} onSelect={handleSelectFromSearch} />
                            </>
                          )}
                          {!isLoading && !error && hasSearched && results.length === 0 && (
                            <div className="text-center text-neutral-500 text-lg py-16">
                                <p>No results found for "{submittedQuery}".</p>
                                <p className="text-md text-neutral-600 mt-2">Try checking the spelling or searching for a different title.</p>
                            </div>
                          )}
                      </div>
                  ) : (
                      <div className="mt-4">
                          {continueWatchingList.length > 0 ? (
                              <ContinueWatchingGrid 
                                  items={continueWatchingList} 
                                  onSelect={handleSelectFromContinueWatching}
                                  onRemove={handleRemoveProgress}
                                  playerTheme={playerTheme.hex.replace('#', '')}
                              />
                          ) : (
                              !isLoading && !error && (
                                <div className="text-center text-neutral-600 py-16 my-8">
                                    <div className="flex justify-center items-center space-x-4 text-neutral-700">
                                        <FilmIcon className="w-20 h-20 opacity-50 -rotate-12"/>
                                        <TvIcon className="w-24 h-24 opacity-60 rotate-6"/>
                                    </div>
                                    <h2 className="text-3xl font-bold mt-8 mb-2 text-white">Your List is Empty</h2>
                                    <p className="text-lg text-neutral-400">Search for a movie or show to get started.</p>
                                </div>
                              )
                          )}
                          <UpdateFromLink
                            value={linkInputValue}
                            onChange={handleLinkInputChange}
                            status={linkUpdateStatus}
                          />
                      </div>
                  )}
              </>
          )}
        </div>
      </main>

      {selectedItem && (
        <EmbedLinkModal 
          item={selectedItem} 
          onClose={handleCloseModal}
          onSave={handleSaveProgress}
          onRemove={handleRemoveProgress}
          onUpdateFromLink={actuallyUpdateFromLink}
          setFeedback={setFeedback}
          isSaved={isItemSelectedAndSaved}
          initialProgress={selectedProgress}
          playerTheme={playerTheme.hex.replace('#', '')}
        />
      )}

      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        item={confirmationState.itemToAdd}
        progress={confirmationState.progressToAdd}
        episodeDetails={confirmationState.episodeDetails}
        onConfirm={confirmationState.onConfirm}
        onCancel={confirmationState.onCancel}
      />

      <ResetConfirmationModal
        isOpen={isResetModalOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={playerTheme}
        onThemeChange={handleThemeChange}
      />

      {showScrollToTop && <ScrollToTopButton onClick={handleScrollToTop} />}

      {feedback && (
        <div 
            className="fixed bottom-5 right-5 bg-neutral-800 border border-neutral-600 text-white p-4 rounded-lg shadow-2xl z-50 animate-fade-in-up max-w-sm"
            role="alert"
        >
            {feedback}
        </div>
      )}
    </div>
  );
};

export default App;
