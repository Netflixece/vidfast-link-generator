

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import type { WatchProgressItem, SearchResult, WatchProgress, ColorInfo, MyListItem } from '../types';
import {
    getContinueWatchingList,
    saveToContinueWatching,
    removeFromContinueWatching,
    exportContinueWatchingList,
    importContinueWatchingList,
    resetSiteData as resetStorage,
    getPlayerTheme,
    setPlayerTheme as savePlayerTheme,
    getMyList,
    saveToMyList,
    removeFromMyList,
} from '../services/storage';
import { DEFAULT_THEME } from '../constants';

interface AppContextState {
    continueWatchingList: WatchProgressItem[];
    myList: MyListItem[];
    playerTheme: ColorInfo;
    feedbackMessage: string | null;
    saveItem: (item: SearchResult, progress: WatchProgress, cleanPosterPath: string | null) => void;
    removeItem: (id: number, media_type: 'movie' | 'tv') => void;
    toggleMyListItem: (item: SearchResult) => void;
    setPlayerTheme: (theme: ColorInfo) => void;
    setFeedback: (message: string) => void;
    exportList: () => void;
    importList: (file: File) => Promise<void>;
    resetData: () => void;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [continueWatchingList, setContinueWatchingList] = useState<WatchProgressItem[]>([]);
    const [myList, setMyList] = useState<MyListItem[]>([]);
    const [playerTheme, setPlayerThemeState] = useState<ColorInfo>(DEFAULT_THEME);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    
    useEffect(() => {
        setContinueWatchingList(getContinueWatchingList());
        setMyList(getMyList());
        setPlayerThemeState(getPlayerTheme());
    }, []);

    useEffect(() => {
        if (feedbackMessage) {
            const timer = setTimeout(() => setFeedbackMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);

    const refreshList = useCallback(() => {
        setContinueWatchingList(getContinueWatchingList());
        setMyList(getMyList());
    }, []);

    const saveItem = useCallback((item: SearchResult, progress: WatchProgress, cleanPosterPath: string | null) => {
        saveToContinueWatching(item, progress, cleanPosterPath);
        refreshList();
    }, [refreshList]);

    const removeItem = useCallback((id: number, media_type: 'movie' | 'tv') => {
        removeFromContinueWatching(id, media_type);
        refreshList();
    }, [refreshList]);

    const setFeedback = useCallback((message: string) => {
        setFeedbackMessage(message);
    }, []);

    const toggleMyListItem = useCallback((item: SearchResult) => {
        const currentMyList = getMyList();
        const isInList = currentMyList.some(i => i.media.id === item.id && i.media.media_type === item.media_type);
        const title = item.media_type === 'movie' ? item.title : item.name;

        if (isInList) {
            removeFromMyList(item.id, item.media_type);
            setFeedback(`'${title}' removed from My List.`);
        } else {
            saveToMyList(item);
            setFeedback(`'${title}' added to My List.`);
        }
        refreshList();
    }, [refreshList, setFeedback]);

    const setPlayerTheme = useCallback((theme: ColorInfo) => {
        savePlayerTheme(theme);
        setPlayerThemeState(theme);
        setFeedbackMessage(`Player theme changed to ${theme.name}`);
    }, []);

    const exportList = useCallback(() => {
        exportContinueWatchingList();
        setFeedbackMessage("Continue Watching list exported successfully.");
    }, []);

    const importList = useCallback(async (file: File) => {
        const reader = new FileReader();
        reader.onerror = () => {
            setFeedback("Error reading the import file.");
        };
        reader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                try {
                    await importContinueWatchingList(text);
                    refreshList();
                    setFeedback("List imported successfully!");
                } catch (err) {
                    setFeedback(err instanceof Error ? err.message : "Failed to import list.");
                }
            }
        };
        reader.readAsText(file);
    }, [refreshList]);
    
    const resetData = useCallback(() => {
        resetStorage();
        refreshList();
        const defaultTheme = DEFAULT_THEME;
        setPlayerThemeState(defaultTheme);
        savePlayerTheme(defaultTheme);
        setFeedback("Site has been reset.");
    }, [refreshList]);

    const value = {
        continueWatchingList,
        myList,
        playerTheme,
        feedbackMessage,
        saveItem,
        removeItem,
        toggleMyListItem,
        setPlayerTheme,
        setFeedback,
        exportList,
        importList,
        resetData
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextState => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};
