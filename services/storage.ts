
import type { WatchProgressItem, SearchResult, WatchProgress, ColorInfo } from '../types';
import { DEFAULT_THEME } from '../constants';

const STORAGE_KEY = 'vidfast_continue_watching';
const THEME_STORAGE_KEY = 'vidfast_player_theme';


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

export const exportContinueWatchingList = () => {
    const list = getContinueWatchingList();
    const dataStr = JSON.stringify(list, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `vidfast-history-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const importContinueWatchingList = (jsonContent: string): Promise<WatchProgressItem[]> => {
    return new Promise((resolve, reject) => {
        try {
            const parsedData = JSON.parse(jsonContent);
            
            if (!Array.isArray(parsedData)) {
                throw new Error("Imported file is not a valid list.");
            }
            
            // A more detailed validation to check item structure
            const validatedList: WatchProgressItem[] = parsedData.filter(item => {
                if (!item || typeof item !== 'object') return false;
                
                const hasRequiredTopLevelKeys = 'media' in item && 'progress' in item && 'savedAt' in item;
                if (!hasRequiredTopLevelKeys) return false;

                const media = item.media;
                if (!media || typeof media !== 'object') return false;

                const hasRequiredMediaKeys = 'id' in media && 'media_type' in media;
                if (!hasRequiredMediaKeys) return false;
                
                if (typeof media.id !== 'number') return false;
                if (media.media_type !== 'movie' && media.media_type !== 'tv') return false;

                // Check for title/name to avoid crashes in UI
                if (media.media_type === 'movie' && typeof (media as any).title !== 'string') return false;
                if (media.media_type === 'tv' && typeof (media as any).name !== 'string') return false;
                
                if (typeof item.savedAt !== 'number') return false;

                return true;
            });

            if (validatedList.length < parsedData.length) {
                console.warn("Some items in the imported file were invalid and have been skipped.");
                // Optionally, provide user feedback about partial import success.
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedList));
            resolve(validatedList.sort((a,b) => b.savedAt - a.savedAt));
        } catch (error) {
            console.error("Failed to import continue watching list", error);
            reject(error instanceof Error ? error : new Error('Failed to parse or validate the imported file.'));
        }
    });
};

export const getPlayerTheme = (): ColorInfo => {
    try {
        const rawData = localStorage.getItem(THEME_STORAGE_KEY);
        if (!rawData) return DEFAULT_THEME;
        const theme: ColorInfo = JSON.parse(rawData);
        // basic validation
        if (theme && typeof theme.name === 'string' && typeof theme.hex === 'string' && theme.hex.startsWith('#')) {
            return theme;
        }
        return DEFAULT_THEME;
    } catch (error) {
        console.error("Failed to parse player theme from localStorage", error);
        return DEFAULT_THEME;
    }
};

export const setPlayerTheme = (theme: ColorInfo): void => {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch (error) {
        console.error("Failed to save player theme to localStorage", error);
    }
};

export const resetSiteData = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(THEME_STORAGE_KEY);
};
