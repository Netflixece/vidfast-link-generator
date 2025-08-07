

import React from 'react';
import type { SearchResult, WatchProgress, Episode } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';

interface ConfirmationModalProps {
  isOpen: boolean;
  item: SearchResult | null;
  progress: WatchProgress | null;
  episodeDetails: Episode | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, item, progress, episodeDetails, onConfirm, onCancel }) => {
  if (!isOpen || !item) return null;

  const isTVEpisode = item.media_type === 'tv' && episodeDetails;

  const title = item.media_type === 'movie' ? item.title : item.name;
  const releaseDate = item.media_type === 'movie' ? item.release_date : item.first_air_date;
  
  const posterUrl = item.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
    : `https://picsum.photos/seed/${item.id}/500/750`;

  const episodeStillUrl = isTVEpisode && episodeDetails.still_path
    ? `${TMDB_IMAGE_BASE_URL.replace('w500', 'w300')}${episodeDetails.still_path}`
    : `https://picsum.photos/seed/${episodeDetails?.id}/300/169`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[60] animate-fade-in-fast" onClick={onCancel}>
      <div 
        className="bg-netflix-dark rounded-xl shadow-2xl w-full text-white animate-zoom-in max-w-4xl md:h-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row overflow-hidden md:h-[460px]">
            <div className="w-full h-48 md:h-full md:w-1/3 flex-shrink-0 bg-black">
                <img src={posterUrl} alt={`Poster for ${title}`} className="w-full h-full object-cover" />
            </div>
            <div className="w-full md:w-2/3 p-6 flex flex-col bg-neutral-900/50 overflow-y-auto">
                {/* Details Section */}
                <div className="flex-grow flex flex-col min-h-0">
                    {isTVEpisode ? (
                        <>
                            <h3 className="text-2xl font-bold mb-2 flex-shrink-0">{title}</h3>
                            <div className="flex items-start mb-4 space-x-4 flex-shrink-0">
                                <img src={episodeStillUrl} alt={`Still from ${episodeDetails.name}`} className="w-48 flex-shrink-0 rounded-md aspect-video object-cover bg-black" />
                                <div className="flex-grow">
                                    <p className="text-lg font-semibold text-netflix-red">S{progress?.season} E{progress?.episode}</p>
                                    <h4 className="text-xl font-bold text-white">{episodeDetails.name}</h4>
                                    {episodeDetails.air_date && (
                                        <p className="text-sm text-neutral-400 mt-1">Aired: {new Date(episodeDetails.air_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-y-auto pr-2 flex-grow mb-4">
                                <p className="text-sm text-neutral-300">{episodeDetails.overview || 'No description available.'}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-2xl font-bold mb-1">{title}</h3>
                            <p className="text-md text-neutral-400 mb-4">{releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}</p>
                            <div className="overflow-y-auto pr-2 flex-grow mb-4">
                                <p className="text-sm text-neutral-300">{item.overview || 'No description available.'}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Confirmation Section */}
                <div className="flex-shrink-0 text-center">
                     <p className="text-base mb-4 mt-2">This isn't in your Continue Watching list. Would you like to add it?</p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={onConfirm} className="bg-netflix-red hover:bg-netflix-red-dark text-white font-bold py-2 px-6 rounded-md transition-colors">Yes, Add</button>
                        <button onClick={onCancel} className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-6 rounded-md transition-colors">No</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
