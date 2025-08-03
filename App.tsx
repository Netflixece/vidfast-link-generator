

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
import SkeletonGrid from './components/SkeletonGrid';
import ContentCarousel from './components/ContentCarousel';
import SkeletonCarousel from './components/SkeletonCarousel';
import { searchMulti, getTvDetails, getMovieDetails, getSeasonDetails, getImages, getTrending, getPopularMovies, getTopRatedTvShows } from './services/tmdb';
import type { SearchResult, WatchProgressItem, WatchProgress, TVSearchResult, Episode, MovieSearchResult, ColorInfo } from './types';
import { FilmIcon, TvIcon, BookOpenIcon, CloseIcon } from './components/Icons';
import { useAppContext } from './contexts/AppContext';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const {
    continueWatchingList,
    playerTheme,
    feedbackMessage,
    saveItem,
    removeItem,
    setFeedback,
    exportList,
    importList,
    resetData,
  } = useAppContext();

  const [view, setView] = useState<'home' | 'how-to-use'>('home');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<WatchProgress | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchBarKey, setSearchBarKey] = useState(Date.now());
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [linkUpdateStatus, setLinkUpdateStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const linkUpdateTimeoutRef = useRef<number | null>(null);
  const [isLinkFadingOut, setIsLinkFadingOut] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  
  // State for homepage content
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [popularMovies, setPopularMovies] = useState<SearchResult[]>([]);
  const [topRatedTv, setTopRatedTv] = useState<SearchResult[]>([]);
  const [isHomepageLoading, setIsHomepageLoading] = useState(true);
  const [homepageError, setHomepageError] = useState<string | null>(null);

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
  
  // Fetch homepage content
  useEffect(() => {
    const controller = new AbortController();
    const fetchHomepageContent = async () => {
        setIsHomepageLoading(true);
        setHomepageError(null);
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
                setHomepageError("Could not load discovery sections. Please try again later.");
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsHomepageLoading(false);
            }
        }
    };

    fetchHomepageContent();
    
    return () => controller.abort();
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

  const fadeAndClearInput = async () => {
    const FADE_DURATION = 800; // Match the CSS animation duration
    setIsLinkFadingOut(true);
    await sleep(FADE_DURATION);
    setLinkInputValue('');
    setLinkUpdateStatus('idle');
    setIsLinkFadingOut(false);
  };
  
  const showSuccessAndClear = async (feedbackMessage: string) => {
    // 1. Show the success checkmark animation
    setLinkUpdateStatus('success');
  
    const CHECKMARK_ANIMATION_DURATION = 1100; // Corresponds to the CSS animation duration
    const FEEDBACK_DURATION = 5000; // Duration the feedback toast is visible
    const POST_ANIMATION_PAUSE = 200; // Small pause for visual separation
  
    // 2. Wait for the checkmark animation to complete
    await sleep(CHECKMARK_ANIMATION_DURATION);
  
    // 3. Hide the checkmark. The input remains populated.
    setLinkUpdateStatus('idle');
  
    // 4. Brief pause for visual separation before showing the feedback toast
    await sleep(POST_ANIMATION_PAUSE);
  
    // 5. Show the feedback message (toast). The `useEffect` for feedback will make it disappear after `FEEDBACK_DURATION`.
    setFeedback(feedbackMessage);
  
    // 6. Wait for the feedback message to have been visible and then disappear.
    await sleep(FEEDBACK_DURATION);
  
    // 7. After the feedback has disappeared, start the fade-out of the input link and clear it.
    await fadeAndClearInput();
  };
  
  const handleLinkInputChange = (url: string) => {
    setLinkInputValue(url);
    if(isLinkFadingOut) setIsLinkFadingOut(false);
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
        
        if (itemToUpdate && itemToUpdate.media.media_type === 'tv') {
            const newProgress = { season: Number(season), episode: Number(episode) };
            saveItem(itemToUpdate.media, newProgress, itemToUpdate.cleanPosterPath || itemToUpdate.media.poster_path);
            showSuccessAndClear(`'${itemToUpdate.media.name}' progress updated to S${newProgress.season} E${newProgress.episode}.`);
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
                      saveItem(newItem, newProgress, posterToSave);
                      handleCloseConfirmation();
                      showSuccessAndClear(`Added '${tvDetails.name}' to Continue Watching.`);
                  },
                  onCancel: () => {
                      handleCloseConfirmation();
                      fadeAndClearInput();
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

        if (itemToUpdate && itemToUpdate.media.media_type === 'movie') {
            saveItem(itemToUpdate.media, {}, itemToUpdate.cleanPosterPath || itemToUpdate.media.poster_path); // Resaves to update timestamp
            showSuccessAndClear(`'${itemToUpdate.media.title}' has been moved to the front of your list.`);
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
                      saveItem(movieDetails, {}, posterToSave);
                      handleCloseConfirmation();
                      showSuccessAndClear(`Added '${movieDetails.title}' to Continue Watching.`);
                  },
                  onCancel: () => {
                      handleCloseConfirmation();
                      fadeAndClearInput();
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

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    resetData();
    // also clear local search state
    setIsResetModalOpen(false);
    setResults([]);
    setSubmittedQuery('');
    setHasSearched(false);
    setError(null);
    setSelectedItem(null);
    setSearchBarKey(Date.now());
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSearchResults = () => {
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
          <ResultsGrid results={results} onSelect={handleSelectFromSearch} />
        </>
      );
    }

    if (!isLoading && !error && hasSearched && results.length === 0) {
      return (
        <div className="text-center text-neutral-500 text-lg py-16">
          <p>No results found for "{submittedQuery}".</p>
          <p className="text-md text-neutral-600 mt-2">Try checking the spelling or searching for a different title.</p>
        </div>
      );
    }
    
    return null;
  };

  const renderHomepageContent = () => {
    if (isHomepageLoading) {
        return (
            <div className="mt-4 space-y-4">
                <SkeletonCarousel />
                <SkeletonCarousel />
                <SkeletonCarousel />
            </div>
        );
    }

    if (homepageError) {
        return <p className="text-center text-red-400 text-lg py-16" role="alert">{homepageError}</p>;
    }

    if (continueWatchingList.length > 0) {
        // Returning User Layout
        return (
            <div className="mt-4">
                <ContinueWatchingGrid onSelect={handleSelectFromContinueWatching} />
                <UpdateFromLink
                    value={linkInputValue}
                    onChange={handleLinkInputChange}
                    status={linkUpdateStatus}
                    isFadingOut={isLinkFadingOut}
                />
                <div className="space-y-4">
                    {trending.length > 0 && <ContentCarousel title="Trending This Week" items={trending} onSelect={handleSelectFromSearch} />}
                    {popularMovies.length > 0 && <ContentCarousel title="Popular Movies" items={popularMovies} onSelect={handleSelectFromSearch} />}
                    {topRatedTv.length > 0 && <ContentCarousel title="Top Rated TV Shows" items={topRatedTv} onSelect={handleSelectFromSearch} />}
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
                    <UpdateFromLink
                        value={linkInputValue}
                        onChange={handleLinkInputChange}
                        status={linkUpdateStatus}
                        isFadingOut={isLinkFadingOut}
                        variant="compact"
                    />
                </div>
                <div className="space-y-4">
                    {trending.length > 0 && <ContentCarousel title="Trending This Week" items={trending} onSelect={handleSelectFromSearch} />}
                    {popularMovies.length > 0 && <ContentCarousel title="Popular Movies" items={popularMovies} onSelect={handleSelectFromSearch} />}
                    {topRatedTv.length > 0 && <ContentCarousel title="Top Rated TV Shows" items={topRatedTv} onSelect={handleSelectFromSearch} />}
                </div>
            </div>
        );
    }
  };


  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="py-8 text-center">
        <div className="container mx-auto pl-6 pr-2 sm:pl-8 sm:pr-3 lg:pl-12 lg:pr-4 relative">
            <div className="absolute top-4 right-2 sm:right-3 lg:right-12">
                <ProfileMenu
                  onImport={importList}
                  onExport={exportList}
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
        </div>
      </header>
      
      {view === 'home' && (
        <div className="sticky top-0 z-10 py-4 bg-black/80 backdrop-blur-sm">
            <div className="container mx-auto pl-6 pr-2 sm:pl-8 sm:pr-3 lg:pl-12 lg:pr-4">
            <SearchBar 
                key={searchBarKey}
                onSearch={handleSearch} 
                isLoading={isLoading} 
            />
            </div>
        </div>
      )}

      <main className="container mx-auto pl-6 pr-2 sm:pl-8 sm:pr-3 lg:pl-12 lg:pr-4 pb-16 min-h-[50vh]">
        <div key={view} className="animate-fade-in">
          {view === 'how-to-use' ? (
              <HowToUseGuide onGoBack={() => setView('home')} />
          ) : hasSearched ? (
              <div className="mt-8">
                {renderSearchResults()}
              </div>
          ) : (
            renderHomepageContent()
          )}
        </div>
      </main>

      {selectedItem && (
        <EmbedLinkModal 
          item={selectedItem} 
          onClose={handleCloseModal}
          onUpdateFromLink={actuallyUpdateFromLink}
          initialProgress={selectedProgress}
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
      />

      {showScrollToTop && <ScrollToTopButton onClick={handleScrollToTop} />}

      {feedbackMessage && (
        <div 
            className="fixed bottom-5 right-5 bg-neutral-800 border border-neutral-600 text-white p-4 rounded-lg shadow-2xl z-50 animate-fade-in-up max-w-sm"
            role="alert"
        >
            {feedbackMessage}
        </div>
      )}
    </div>
  );
};

export default App;
