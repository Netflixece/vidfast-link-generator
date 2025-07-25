
import type { WatchProgressItem, SearchResult, WatchProgress } from '../types';

const STORAGE_KEY = 'vidfast_continue_watching';

export const getContinueWatchingList = (): WatchProgressItem[] => {
    try {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (!rawData) return [];
        const items: WatchProgressItem[] = JSON.parse(rawData);
        // Sort by most recently saved
        return items.sort((a, b) => b.savedAt - a.savedAt);
    } catch (error) {
        console.error("Failed to parse continue watching list from localStorage", error);
        return [];
    }
};

export const saveToContinueWatching = (item: SearchResult, progress: WatchProgress = {}, cleanPosterPath: string | null): void => {
    const list = getContinueWatchingList();
    const existingIndex = list.findIndex(i => i.media.id === item.id && i.media.media_type === item.media_type);

    const newItem: WatchProgressItem = {
        media: item,
        progress: progress,
        savedAt: Date.now(),
        cleanPosterPath: cleanPosterPath,
    };

    if (existingIndex > -1) {
        // Update existing item
        list[existingIndex] = newItem;
    } else {
        // Add new item to the beginning
        list.unshift(newItem);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.sort((a,b) => b.savedAt - a.savedAt)));
};


export const removeFromContinueWatching = (id: number, media_type: 'movie' | 'tv'): void => {
    let list = getContinueWatchingList();
    list = list.filter(i => !(i.media.id === id && i.media.media_type === media_type));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};
