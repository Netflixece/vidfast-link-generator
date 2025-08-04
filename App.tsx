import React, { useState, useCallback, useRef, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import EmbedLinkModal from './components/EmbedLinkModal';
import ConfirmationModal from './components/ConfirmationModal';
import HowToUseGuide from './components/HowToUseGuide';
import ResetConfirmationModal from './components/ResetConfirmationModal';
import ScrollToTopButton from './components/ScrollToTopButton';
import ThemeModal from './components/ThemeModal';
import AppHeader from './components/AppHeader';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import TvShowsPage from './pages/TvShowsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import { searchMulti, getTvDetails, getMovieDetails, getSeasonDetails, getImages } from './services/tmdb';
import type { SearchResult, WatchProgressItem, WatchProgress, TVSearchResult, Episode } from './types';
import { useAppContext } from './contexts/AppContext';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const {
    continueWatchingList,
    feedbackMessage,
    saveItem,
    setFeedback,
    exportList,
    importList,
    resetData,
  } = useAppContext();

  const [view, setView] = useState<'home' | 'how-to-use' | 'movies' | 'tv-shows'>('home');
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
  const [isGuideClosing, setIsGuideClosing] = useState(false);
  
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

    setView('home'); // always return to home view for search
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
    const continueWatchingItem = continueWatchingList.find(cw => cw.media.id === item.id && cw.media.media_type === item.media_type);
    setSelectedProgress(continueWatchingItem?.progress);
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
  
  const handleSelectCategory = (category: 'movies' | 'tv-shows') => {
    setView(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const closeGuideWithAnimation = useCallback(() => {
    if (isGuideClosing) return; // Prevent re-trigger
    setIsGuideClosing(true);
    setTimeout(() => {
        setHasSearched(false);
        setSelectedItem(null);
        setView('home');
        setIsGuideClosing(false); // Reset after view changes
    }, 500); // Animation duration
  }, [isGuideClosing]);

  const handleGoHome = useCallback(() => {
    if (view === 'how-to-use') {
        closeGuideWithAnimation();
        return;
    }
    abortControllerRef.current?.abort();
    setSubmittedQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
    setSelectedItem(null);
    setIsLoading(false);
    setSearchBarKey(Date.now());
    setView('home');
  }, [view, closeGuideWithAnimation]);

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
  
  const handleToggleGuide = () => {
    if (view === 'how-to-use') {
        closeGuideWithAnimation();
    } else {
        setView('how-to-use');
    }
  };

  const renderContent = () => {
    switch(view) {
        case 'movies':
            return <MoviesPage onSelect={handleSelectFromSearch} />;
        case 'tv-shows':
            return <TvShowsPage onSelect={handleSelectFromSearch} />;
        case 'how-to-use':
             return <HowToUseGuide onGoBack={closeGuideWithAnimation} isClosing={isGuideClosing} />;
        case 'home':
        default:
            return hasSearched ? (
                <div className="mt-8">
                    <SearchResultsPage 
                        submittedQuery={submittedQuery}
                        results={results}
                        isLoading={isLoading}
                        error={error}
                        onSelect={handleSelectFromSearch}
                    />
                </div>
            ) : (
                <HomePage 
                    onSelectCategory={handleSelectCategory}
                    onSelect={handleSelectFromSearch}
                    onSelectFromContinueWatching={handleSelectFromContinueWatching}
                    linkProps={{
                        value: linkInputValue,
                        onChange: handleLinkInputChange,
                        status: linkUpdateStatus,
                        isFadingOut: isLinkFadingOut,
                    }}
                />
            );
    }
  };


  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <AppHeader
        view={view}
        onGoHome={handleGoHome}
        onToggleGuide={handleToggleGuide}
        onImport={importList}
        onExport={exportList}
        onReset={handleReset}
        onThemeSelect={() => setIsThemeModalOpen(true)}
      />
      
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
        {renderContent()}
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
