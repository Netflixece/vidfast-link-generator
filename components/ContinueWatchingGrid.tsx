
import React from 'react';
import { TMDB_IMAGE_BASE_URL, VIDFAST_MOVIE_URL, VIDFAST_TV_URL } from '../constants';
import type { WatchProgressItem } from '../types';
import { TrashIcon, PlayIcon } from './Icons';

interface ContinueWatchingCardProps {
  item: WatchProgressItem;
  onSelect: (item: WatchProgressItem) => void;
  onRemove: (id: number, media_type: 'movie' | 'tv') => void;
  playerTheme: string;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ item, onSelect, onRemove, playerTheme }) => {
  const { media, progress, cleanPosterPath } = item;
  const title = media.media_type === 'movie' ? media.title : media.name;
  
  const posterPath = cleanPosterPath || media.poster_path;
  const posterUrl = posterPath
    ? `${TMDB_IMAGE_BASE_URL}${posterPath}`
    : `https://picsum.photos/seed/${media.id}/500/750`;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(media.id, media.media_type);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const themeParam = `&theme=${playerTheme}`;
    let link = null;

    if (media.media_type === 'movie') {
      link = `${VIDFAST_MOVIE_URL}${media.id}?autoPlay=true${themeParam}`;
    } else if (media.media_type === 'tv' && progress.season && progress.episode) {
      link = `${VIDFAST_TV_URL}${media.id}/${progress.season}/${progress.episode}?autoPlay=true&nextButton=true&autoNext=true${themeParam}`;
    }

    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };
  
  let progressText = '';
  if (media.media_type === 'tv' && progress.season && progress.episode) {
      progressText = `S${progress.season} E${progress.episode}`;
  } else if (media.media_type === 'movie') {
      progressText = 'Continue Watching';
  } else {
      progressText = 'Saved';
  }

  return (
    <div onClick={() => onSelect(item)} className="bg-netflix-dark rounded-md overflow-hidden shadow-lg group relative cursor-pointer transform hover:-translate-y-2 transition-transform duration-300">
      <img
        src={posterUrl}
        alt={`Poster for ${title}`}
        className="w-full h-auto object-cover aspect-[2/3] group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      {/* Permanent gradient for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none"></div>
      {/* Permanent text */}
      <div className="absolute inset-x-0 bottom-0 p-3 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
          <h3 className="font-bold truncate">{title}</h3>
          <p className="text-sm text-neutral-300">{progressText}</p>
      </div>
      
      {/* Hover elements */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3">
        <button onClick={handlePlayClick} className="bg-white/20 backdrop-blur-sm border-2 border-white/50 text-white rounded-full p-3 hover:bg-white/30 transform hover:scale-110 transition-all" aria-label={`Resume ${title}`}>
            <PlayIcon className="w-8 h-8" />
        </button>
      </div>

      <button onClick={handleRemove} className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white rounded-full p-2 hover:bg-netflix-red transition-colors opacity-0 group-hover:opacity-100 duration-300" aria-label={`Remove ${title} from list`}>
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ContinueWatchingCard;
