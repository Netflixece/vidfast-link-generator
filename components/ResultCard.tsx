
import React from 'react';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import type { SearchResult } from '../types';
import { FilmIcon, TvIcon, TrashIcon } from './Icons';

interface ResultCardProps {
  item: SearchResult;
  onSelect: (item: SearchResult) => void;
  onRemove?: (item: SearchResult) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ item, onSelect, onRemove }) => {
  const title = item.media_type === 'movie' ? item.title : item.name;
  const releaseDate = item.media_type === 'movie' ? item.release_date : item.first_air_date;
  
  const posterUrl = item.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
    : `https://picsum.photos/seed/${item.id}/500/750`;

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
        onRemove(item);
    }
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className="bg-netflix-dark rounded-md overflow-hidden shadow-lg hover:scale-105 hover:shadow-lg hover:shadow-netflix-red/40 transform transition-all duration-300 cursor-pointer group"
    >
      <div className="relative">
        <img
          src={posterUrl}
          alt={`Poster for ${title}`}
          className="w-full h-auto object-cover aspect-[2/3] transition-opacity duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 p-1.5 bg-black/60 rounded-full text-white z-10">
            {item.media_type === 'movie' ? <FilmIcon className="w-5 h-5" /> : <TvIcon className="w-5 h-5" />}
        </div>
        {onRemove && (
            <button
                onClick={handleRemoveClick}
                className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white rounded-full p-2 hover:bg-netflix-red transition-colors opacity-0 group-hover:opacity-100 duration-300 z-10"
                aria-label={`Remove ${title} from list`}
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-md font-bold text-white truncate">{title}</h3>
        <p className="text-sm text-neutral-400">{releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}</p>
      </div>
    </div>
  );
};

export default ResultCard;
