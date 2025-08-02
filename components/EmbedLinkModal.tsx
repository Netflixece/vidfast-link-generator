

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { SearchResult, TVDetails, WatchProgress, SeasonDetails } from '../types';
import { getTvDetails, getSeasonDetails, getImages } from '../services/tmdb';
import { VIDFAST_MOVIE_URL, VIDFAST_TV_URL, TMDB_IMAGE_BASE_URL } from '../constants';
import { CloseIcon, CopyIcon, ExternalLinkIcon, TrashIcon, BookmarkIcon, SpinnerIcon } from './Icons';

interface EmbedLinkModalProps {
  item: SearchResult;
  onClose: () => void;
  onSave: (item: SearchResult, progress: WatchProgress, cleanPosterPath: string | null) => void;
  onRemove: (id: number, media_type: 'movie' | 'tv') => void;
  onUpdateFromLink: (url: string) => void;
  setFeedback: (message: string) => void;
  isSaved: boolean;
  initialProgress?: WatchProgress;
  playerTheme: string;
}

const EmbedLinkModal: React.FC<EmbedLinkModalProps> = ({ item, onClose, onSave, onRemove, onUpdateFromLink, setFeedback, isSaved, initialProgress, playerTheme }) => {
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<SeasonDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingSeason, setIsLoadingSeason] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const [cleanPosterPath, setCleanPosterPath] = useState<string | null>(null);

  const [selectedSeason, setSelectedSeason] = useState<number>(initialProgress?.season || 1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(initialProgress?.episode || 1);
  const [isCopied, setIsCopied] = useState(false);
  
  const episodeListRef = useRef<HTMLDivElement>(null);
  const episodeRefs = useRef<(HTMLDivElement | null)[]>([]);


  const isMovie = item.media_type === 'movie';
  const title = isMovie ? item.title : item.name;
  const posterUrl = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : `https://picsum.photos/seed/${item.id}/500/750`;

  const availableSeasons = useMemo(() => {
    if (!tvDetails) return [];
    return tvDetails.seasons.filter(s => s.season_number > 0 && s.episode_count > 0);
  }, [tvDetails]);

  // Fetch clean poster
  useEffect(() => {
    const controller = new AbortController();
    getImages(item.id, item.media_type, controller.signal)
      .then(images => {
        if (!images.posters || images.posters.length === 0) {
          setCleanPosterPath(item.poster_path); // fallback to original
          return;
        }
        // Heuristic: prefer posters with no language ('null'), as they are often textless.
        const textlessPoster = images.posters.find(p => p.iso_639_1 === null);
        setCleanPosterPath(textlessPoster?.file_path || images.posters[0]?.file_path || item.poster_path);
      })
      .catch(err => {
        if (!controller.signal.aborted) {
            console.error("Failed to fetch images, falling back to default poster.", err);
            setCleanPosterPath(item.poster_path);
        }
      });
    
    return () => controller.abort();
  }, [item.id, item.media_type, item.poster_path]);

  // Fetch base TV show details (for season list)
  useEffect(() => {
    if (item.media_type === 'tv') {
      setIsLoadingDetails(true);
      setError(null);
      const controller = new AbortController();
      getTvDetails(item.id, controller.signal)
        .then(details => {
            setTvDetails(details);
            const seasonToSelect = initialProgress?.season || (details.seasons.find(s => s.season_number > 0) || details.seasons[0])?.season_number;
            if(seasonToSelect) {
                setSelectedSeason(seasonToSelect);
            }
        })
        .catch(err => {
            if (!controller.signal.aborted) setError('Could not load TV show details.')
        })
        .finally(() => {
            if (!controller.signal.aborted) setIsLoadingDetails(false)
        });
      return () => controller.abort();
    }
  }, [item.id, item.media_type, initialProgress?.season]);

  // Fetch details of selected season (for episode list)
  useEffect(() => {
      if (item.media_type === 'tv' && tvDetails && selectedSeason > 0) {
        setIsLoadingSeason(true);
        setSeasonError(null);
        setSeasonDetails(null);
        const controller = new AbortController();
        getSeasonDetails(item.id, selectedSeason, controller.signal)
            .then(details => setSeasonDetails(details))
            .catch(err => {
                if (!controller.signal.aborted) setSeasonError('Could not load episode list.')
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingSeason(false)
            });
        return () => controller.abort();
      }
  }, [item.id, selectedSeason, tvDetails, item.media_type]);

  // Scroll to selected episode
  useEffect(() => {
    if (seasonDetails && episodeRefs.current[selectedEpisode - 1]) {
        episodeRefs.current[selectedEpisode - 1]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    }
  }, [selectedEpisode, seasonDetails]);


  const embedLink = useMemo(() => {
    const themeParam = `&theme=${playerTheme}`;
    if (item.media_type === 'movie') {
      return `${VIDFAST_MOVIE_URL}${item.id}?autoPlay=true${themeParam}`;
    }
    if (item.media_type === 'tv' && tvDetails) {
      return `${VIDFAST_TV_URL}${item.id}/${selectedSeason}/${selectedEpisode}?autoPlay=true&nextButton=true&autoNext=true${themeParam}`;
    }
    return '';
  }, [item, tvDetails, selectedSeason, selectedEpisode, playerTheme]);

  const handleCopy = () => {
    if (!embedLink) return;
    navigator.clipboard.writeText(embedLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleOpenAndSave = () => {
    if (cleanPosterPath === null && item.media_type === 'tv') return; // Don't save if poster isn't resolved yet
    const progress: WatchProgress = item.media_type === 'tv' ? { season: selectedSeason, episode: selectedEpisode } : {};
    const posterToSave = item.media_type === 'tv' ? cleanPosterPath : item.poster_path;
    onSave(item, progress, posterToSave);
  };

  const handleRemove = () => {
    onRemove(item.id, item.media_type);
    onClose();
  };
  
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSeason(Number(e.target.value));
    setSelectedEpisode(1);
    if(episodeListRef.current) {
        episodeListRef.current.scrollTop = 0;
    }
  };

  const handleEpisodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEpisode(Number(e.target.value));
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in-fast" onClick={onClose}>
      <div 
        className={`bg-netflix-dark rounded-xl shadow-2xl w-full text-white animate-zoom-in flex relative ${isMovie ? 'max-w-4xl flex-row' : 'max-w-6xl flex-row h-[90vh] max-h-[800px]'}`} 
        onClick={e => e.stopPropagation()}
      >
        {isMovie ? (
          <>
            {/* MOVIE LAYOUT */}
            <div className="w-1/3 flex-shrink-0 bg-black">
              <img src={posterUrl} alt={`Poster for ${title}`} className="w-full h-full object-cover rounded-l-xl"/>
            </div>
            <div className="w-2/3 p-6 flex flex-col">
              <button onClick={onClose} className="absolute top-3 right-3 z-10 text-neutral-500 hover:text-white transition-colors bg-black/30 rounded-full p-1">
                <CloseIcon className="w-6 h-6" />
              </button>
              {/* Details Section */}
              <div className="flex-grow mb-6 flex flex-col min-h-0">
                <div className="flex justify-between items-start flex-shrink-0">
                  <h2 className="text-3xl font-bold mb-2 pr-8">{title}</h2>
                </div>
                {item.release_date && (
                  <p className="text-md text-neutral-400 mb-4 flex-shrink-0">
                    Aired: {new Date(item.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                <div className="overflow-y-auto pr-2 flex-grow">
                  <p className="text-sm text-neutral-300">{item.overview || 'No description available.'}</p>
                </div>
              </div>
              
              {/* Actions Section */}
              <div className="flex-shrink-0">
                {embedLink ? (
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Generated VidFast Link</label>
                    <div className="flex items-center space-x-2">
                      <input type="text" readOnly value={embedLink} className="flex-grow bg-black/50 text-neutral-300 border border-neutral-700 rounded-md py-2 px-3" />
                      <button onClick={handleCopy} className={`p-2 rounded-md transition-colors ${isCopied ? 'bg-green-600' : 'bg-neutral-700 hover:bg-neutral-600'}`} title={isCopied ? 'Copied!' : 'Copy to clipboard'}>
                        <CopyIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-col mt-6 space-y-3">
                      <a href={embedLink} target="_blank" rel="noopener noreferrer" onClick={handleOpenAndSave} className="w-full flex items-center justify-center bg-netflix-red hover:bg-netflix-red-dark text-white font-bold py-3 px-4 rounded-md transition-colors text-center">
                        <BookmarkIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                        Open Link in New Tab & Save to Continue Watching
                      </a>
                      <a href={embedLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 rounded-md transition-colors text-center">
                        <ExternalLinkIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                        Open Link in New Tab (without saving)
                      </a>
                      {isSaved && (
                        <button onClick={handleRemove} className="w-full flex items-center justify-center bg-transparent border border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold py-2 px-3 rounded-md transition-colors" title="Remove from Continue Watching">
                          <TrashIcon className="w-5 h-5 mr-2" />
                          Remove from List
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">Generating link...</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* TV SHOW LAYOUT - REDESIGNED */}
            <button onClick={onClose} className="absolute top-3 right-3 z-10 text-neutral-500 hover:text-white transition-colors bg-black/30 rounded-full p-1">
              <CloseIcon className="w-6 h-6" />
            </button>
            {/* Left Pane: Show Info */}
            <div className="w-1/3 flex-shrink-0 bg-black/30 flex flex-col">
              <div className="relative h-2/3">
                <img src={cleanPosterPath ? `${TMDB_IMAGE_BASE_URL}${cleanPosterPath}` : posterUrl} alt={`Poster for ${title}`} className="w-full h-full object-cover"/>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className="p-5 flex-grow flex flex-col min-h-0">
                <h2 className="text-3xl font-bold mb-2">{title}</h2>
                {item.first_air_date && (
                  <p className="text-sm text-neutral-400 mb-3 flex-shrink-0">
                    First Aired: {new Date(item.first_air_date).getFullYear()}
                  </p>
                )}
                <div className="overflow-y-auto text-sm text-neutral-300 pr-2">
                  {item.overview || 'No description available.'}
                </div>
              </div>
            </div>

            {/* Right Pane: Episodes & Actions */}
            <div className="w-2/3 flex flex-col bg-neutral-900/50">
               {/* Top: Season & Episode Selectors */}
              <div className="p-4 flex-shrink-0 border-b border-neutral-800/70">
                {isLoadingDetails && <div className="text-center p-2">Loading...</div>}
                {error && <div className="text-center p-2 text-red-400">{error}</div>}
                {tvDetails && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-10">
                    {availableSeasons.length > 0 ? (
                      <>
                        <div className="flex items-center space-x-2 w-full sm:w-auto flex-1 min-w-0">
                          <label htmlFor="season" className="text-lg font-bold text-neutral-300 flex-shrink-0">Season</label>
                          <select
                            id="season"
                            value={selectedSeason}
                            onChange={handleSeasonChange}
                            className="bg-neutral-800 border border-neutral-700 rounded-md py-2 px-3 focus:ring-netflix-red focus:border-netflix-red w-full"
                          >
                            {availableSeasons.map(season => (
                              <option key={season.id} value={season.season_number}>
                                {season.name}
                              </option>
                            ))}
                          </select>
                        </div>
                         <div className="flex items-center space-x-2 w-full sm:w-auto flex-1 min-w-0">
                          <label htmlFor="episode" className="text-lg font-bold text-neutral-300 flex-shrink-0">Episode</label>
                          <select
                            id="episode"
                            value={selectedEpisode}
                            onChange={handleEpisodeChange}
                            className="bg-neutral-800 border border-neutral-700 rounded-md py-2 px-3 focus:ring-netflix-red focus:border-netflix-red w-full truncate"
                            disabled={isLoadingSeason || !seasonDetails?.episodes.length}
                          >
                            {!isLoadingSeason && seasonDetails?.episodes.map(episode => (
                                <option key={episode.id} value={episode.episode_number} title={episode.name}>
                                    {episode.episode_number}. {episode.name}
                                </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <p className="text-neutral-400 w-full">No seasons available for this show.</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Middle: Episode List (scrollable) */}
              <div ref={episodeListRef} className="flex-grow overflow-y-auto p-4 space-y-3">
                {isLoadingSeason && <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-8 h-8 text-netflix-red" /></div>}
                {seasonError && <div className="text-center p-4 text-red-400">{seasonError}</div>}
                {seasonDetails && !isLoadingSeason && !seasonDetails.episodes.length && (
                    <div className="text-center text-neutral-500 py-10">
                      No episodes listed for this season.
                    </div>
                )}
                {seasonDetails?.episodes.map(episode => {
                    const stillUrl = episode.still_path ? `${TMDB_IMAGE_BASE_URL.replace('w500', 'w300')}${episode.still_path}` : `https://picsum.photos/seed/${episode.id}/300/169`;
                    const isSelected = selectedEpisode === episode.episode_number;
                    return (
                        <div 
                            key={episode.id}
                            ref={el => { episodeRefs.current[episode.episode_number - 1] = el; }}
                            onClick={() => setSelectedEpisode(episode.episode_number)}
                            className={`flex items-start p-2 rounded-lg cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'bg-netflix-red/20 border-netflix-red' : 'bg-neutral-800/80 border-transparent hover:bg-neutral-700/80'}`}
                        >
                            <div className="w-10 text-center flex-shrink-0 mr-3">
                                <span className={`font-bold text-xl ${isSelected ? 'text-white' : 'text-neutral-500'}`}>{episode.episode_number}</span>
                            </div>
                            <img src={stillUrl} alt={`Still from ${episode.name}`} className="w-32 flex-shrink-0 rounded-md mr-4 aspect-video object-cover bg-black" loading="lazy" />
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-baseline pr-4">
                                  <h4 className="font-bold text-white truncate flex-1">{episode.name}</h4>
                                  {episode.air_date && (
                                      <p className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                                          {new Date(episode.air_date).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                          })}
                                      </p>
                                  )}
                                </div>
                                <p className="text-xs text-neutral-400 line-clamp-2 mt-1 pr-4">
                                    {episode.overview || 'No description available.'}
                                </p>
                            </div>
                        </div>
                    );
                })}
              </div>

              {/* Bottom: Actions */}
              <div className="p-4 flex-shrink-0 border-t border-neutral-800/70 bg-netflix-dark/50">
                {embedLink ? (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="text"
                        readOnly
                        value={embedLink}
                        className="flex-grow bg-black/50 text-neutral-300 border border-neutral-700 rounded-md py-2 px-3"
                      />
                      <button
                        onClick={handleCopy}
                        className={`p-2 rounded-md transition-colors ${isCopied ? 'bg-green-600' : 'bg-neutral-700 hover:bg-neutral-600'}`}
                        title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                      >
                        <CopyIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                        <a
                          href={embedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleOpenAndSave}
                          className="w-full flex items-center justify-center bg-netflix-red hover:bg-netflix-red-dark text-white font-bold py-3 px-4 rounded-md transition-colors text-center text-sm"
                        >
                          <BookmarkIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                          Open & Save to Continue Watching
                        </a>
                        
                        <a
                          href={embedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 rounded-md transition-colors text-center text-sm"
                        >
                          <ExternalLinkIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                          Open without Saving
                        </a>
                    </div>

                    {isSaved && (
                        <div className="mt-3 pt-3 border-t border-neutral-700/50">
                            <button
                                onClick={handleRemove}
                                className="w-full flex items-center justify-center bg-transparent border border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold py-2 px-3 rounded-md transition-colors text-sm"
                                title="Remove from Continue Watching"
                            >
                                <TrashIcon className="w-5 h-5 mr-2" />
                                Remove from List
                            </button>
                        </div>
                    )}
                  </div>
                ) : <div className="text-center p-4">Select an episode to generate a link.</div> }
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmbedLinkModal;
