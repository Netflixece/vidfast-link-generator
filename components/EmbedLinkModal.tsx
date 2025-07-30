


import React, { useState, useEffect, useMemo } from 'react';
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
}

const EmbedLinkModal: React.FC<EmbedLinkModalProps> = ({ item, onClose, onSave, onRemove, onUpdateFromLink, setFeedback, isSaved, initialProgress }) => {
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
  const [pastedLink, setPastedLink] = useState('');

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
      if (item.media_type === 'tv' && tvDetails) {
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


  const embedLink = useMemo(() => {
    const themeParam = '&theme=E50914';
    if (item.media_type === 'movie') {
      return `${VIDFAST_MOVIE_URL}${item.id}?autoPlay=true${themeParam}`;
    }
    if (item.media_type === 'tv' && tvDetails) {
      return `${VIDFAST_TV_URL}${item.id}/${selectedSeason}/${selectedEpisode}?autoPlay=true&nextButton=true&autoNext=true${themeParam}`;
    }
    return '';
  }, [item, tvDetails, selectedSeason, selectedEpisode]);

  const handleCopy = () => {
    if (!embedLink) return;
    navigator.clipboard.writeText(embedLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleOpenAndSave = () => {
    if (cleanPosterPath === null) return; // Don't save if poster isn't resolved yet
    const progress: WatchProgress = item.media_type === 'tv' ? { season: selectedSeason, episode: selectedEpisode } : {};
    onSave(item, progress, cleanPosterPath);
  };

  const handleRemove = () => {
    onRemove(item.id, item.media_type);
    onClose();
  };

  const handleUpdateFromPastedLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = pastedLink.trim();
    if (!url) return;

    if (item.media_type !== 'tv') return;

    const tvRegex = /vidfast\.pro\/tv\/(\d+)/;
    const match = url.match(tvRegex);

    if (!match) {
        setFeedback('Invalid TV show link. Please paste a valid VidFast TV show URL.');
        onClose();
        return;
    }

    const linkId = Number(match[1]);
    if (linkId !== item.id) {
        try {
            const mismatchedShowDetails = await getTvDetails(linkId);
            setFeedback(`Link mismatch. Pasted link is for '${mismatchedShowDetails.name}'. Please use a link for '${item.name}'.`);
        } catch (err) {
            console.error("Failed to fetch mismatched show details", err);
            setFeedback(`Link mismatch. The pasted link is for a different show. Please use a link for '${item.name}'.`);
        }
        onClose();
        return;
    }
    
    onUpdateFromLink(url);
    onClose();
  };

  const isMovie = item.media_type === 'movie';
  const title = isMovie ? item.title : item.name;
  const posterUrl = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : `https://picsum.photos/seed/${item.id}/500/750`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in-fast" onClick={onClose}>
      <div 
        className={`bg-netflix-dark rounded-xl shadow-2xl w-full text-white animate-zoom-in flex ${isMovie ? 'max-w-4xl flex-row' : 'max-w-6xl flex-col'}`} 
        style={isMovie ? {} : {height: '95vh'}} 
        onClick={e => e.stopPropagation()}
      >
        {isMovie ? (
          <>
            {/* MOVIE LAYOUT */}
            <div className="w-1/3 flex-shrink-0 bg-black">
              <img src={posterUrl} alt={`Poster for ${title}`} className="w-full h-full object-cover rounded-l-xl"/>
            </div>
            <div className="w-2/3 p-6 flex flex-col">
              {/* Details Section */}
              <div className="flex-grow mb-6 flex flex-col min-h-0">
                <div className="flex justify-between items-start flex-shrink-0">
                  <h2 className="text-3xl font-bold mb-2 pr-8">{title}</h2>
                  <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                    <CloseIcon className="w-6 h-6" />
                  </button>
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
                        Open Link in New Tab (without saving to Continue Watching)
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
            {/* TV SHOW LAYOUT */}
            <div className="p-6 relative flex-shrink-0">
              <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">
                <CloseIcon className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold mb-4 pr-8">{title}</h2>

              {item.media_type === 'tv' && (
                <>
                  {isLoadingDetails && <div className="text-center p-4">Loading season data...</div>}
                  {error && <div className="text-center p-4 text-red-400">{error}</div>}
                  {tvDetails && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="season" className="block text-sm font-medium text-neutral-400 mb-1">Season</label>
                        <select
                          id="season"
                          value={selectedSeason}
                          onChange={e => {
                              setSelectedSeason(Number(e.target.value));
                              setSelectedEpisode(1);
                          }}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md py-2 px-3 focus:ring-netflix-red focus:border-netflix-red"
                        >
                          {tvDetails.seasons.filter(s => s.season_number > 0 && s.episode_count > 0).map(season => (
                            <option key={season.id} value={season.season_number}>
                              {season.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="episode" className="block text-sm font-medium text-neutral-400 mb-1">Episode</label>
                        <select
                          id="episode"
                          value={selectedEpisode}
                          onChange={e => setSelectedEpisode(Number(e.target.value))}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md py-2 px-3 focus:ring-netflix-red focus:border-netflix-red"
                        >
                          {seasonDetails && seasonDetails.episodes.map(ep => (
                              <option key={ep.id} value={ep.episode_number}>
                                  Episode {ep.episode_number}: {ep.name}
                              </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Episode List */}
            <div className="flex-grow overflow-y-auto px-6 pb-6 space-y-3">
                {isLoadingSeason && <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-8 h-8 text-netflix-red" /></div>}
                {seasonError && <div className="text-center p-4 text-red-400">{seasonError}</div>}
                {seasonDetails && seasonDetails.episodes.map(episode => {
                    const stillUrl = episode.still_path ? `${TMDB_IMAGE_BASE_URL.replace('w500', 'w300')}${episode.still_path}` : `https://picsum.photos/seed/${episode.id}/300/169`;
                    return (
                        <div 
                            key={episode.id}
                            onClick={() => setSelectedEpisode(episode.episode_number)}
                            className={`flex items-start p-3 rounded-lg cursor-pointer transition-all duration-200 border ${selectedEpisode === episode.episode_number ? 'bg-netflix-red/20 border-netflix-red' : 'bg-neutral-800/80 border-transparent hover:bg-neutral-700/80'}`}
                        >
                            <img src={stillUrl} alt={`Still from ${episode.name}`} className="w-40 flex-shrink-0 rounded-md mr-4 aspect-video object-cover bg-black" loading="lazy" />
                            <div className="flex-grow">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h4 className="font-bold text-white pr-4">E{episode.episode_number}: {episode.name}</h4>
                                    {episode.air_date && (
                                        <p className="text-xs text-neutral-400 flex-shrink-0">
                                            {new Date(episode.air_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                                <p className="text-sm text-neutral-400 line-clamp-3">{episode.overview || 'No description available.'}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Actions and Link Section */}
            <div className="p-6 border-t border-neutral-800/50 flex-shrink-0 bg-netflix-dark/50">
              {embedLink ? (
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Generated VidFast Link</label>
                  <div className="flex items-center space-x-2">
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
                  <div className="flex flex-col mt-6 space-y-3">
                      <a
                        href={embedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleOpenAndSave}
                        className="w-full flex items-center justify-center bg-netflix-red hover:bg-netflix-red-dark text-white font-bold py-3 px-4 rounded-md transition-colors text-center"
                      >
                        <BookmarkIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                        Open Link in New Tab & Save to Continue Watching
                      </a>
                      
                      <a
                        href={embedLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-4 rounded-md transition-colors text-center"
                      >
                        <ExternalLinkIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                        Open Link in New Tab (without saving to Continue Watching)
                      </a>

                      {isSaved && item.media_type === 'tv' && (
                          <form onSubmit={handleUpdateFromPastedLink} className="pt-3 border-t border-neutral-800">
                              <label className="block text-sm font-medium text-neutral-400 mb-2">
                                  Update Progress with Link
                              </label>
                              <div className="flex items-center space-x-2">
                                  <input
                                      type="url"
                                      value={pastedLink}
                                      onChange={(e) => setPastedLink(e.target.value)}
                                      placeholder="Paste new episode link here..."
                                      className="flex-grow bg-black/50 text-neutral-300 border border-neutral-700 rounded-md py-2 px-3 focus:ring-netflix-red focus:border-netflix-red"
                                  />
                                  <button
                                      type="submit"
                                      disabled={!pastedLink.trim()}
                                      className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                                  >
                                      Update
                                  </button>
                              </div>
                          </form>
                      )}

                      {isSaved && (
                          <button
                              onClick={handleRemove}
                              className="w-full flex items-center justify-center bg-transparent border border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold py-2 px-3 rounded-md transition-colors"
                              title="Remove from Continue Watching"
                          >
                              <TrashIcon className="w-5 h-5 mr-2" />
                              Remove from List
                          </button>
                      )}
                  </div>
                </div>
              ) : null }
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmbedLinkModal;
