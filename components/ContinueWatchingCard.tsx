
import React from 'react';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import type { WatchProgressItem } from '../types';
import { TrashIcon, PlayIcon } from './Icons';

interface ContinueWatchingCardProps {
  item: WatchProgressItem;
  onSelect: (item: WatchProgressItem) => void;
  onRemove: (id: number, media_type: 'movie' | 'tv') => void;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ item, onSelect, onRemove }) => {
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
  
  let progressText = '';
  if (media.media_type === 'tv' && progress.season && progress.episode) {
      progressText = `S${progress.season} E${progress.episode}`;
  } else if (media.media_type === 'movie') {
      progressText = 'Continue Watching';
  } else {
      progressText = 'Saved';
  }

  return (
    <div onClick={() => onSelect(item)} className="bg-netflix-dark rounded-md overflow-hidden shadow-lg transition-all duration-300 group relative cursor-pointer">
      <img
        src={posterUrl}
        alt={`Poster for ${title}`}
        className="w-full h-auto object-cover aspect-[2/3]"
        loading="lazy"
      />
       <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 p-3 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
            <h3 className="font-bold truncate">{title}</h3>
            <p className="text-sm text-neutral-300">{progressText}</p>
        </div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3">
        <button onClick={() => onSelect(item)} className="bg-white/90 text-black rounded-full p-4 hover:bg-white hover:scale-110 transition-transform mb-4" aria-label={`Resume ${title}`}>
            <PlayIcon className="w-6 h-6" />
        </button>
        <button onClick={handleRemove} className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-2 hover:bg-netflix-red transition-colors" aria-label={`Remove ${title} from list`}>
            <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ContinueWatchingCard;