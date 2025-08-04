import React from 'react';
import ProfileMenu from './ProfileMenu';
import { ChevronLeftIcon, BookOpenIcon, CloseIcon } from './Icons';

interface AppHeaderProps {
    view: 'home' | 'how-to-use' | 'movies' | 'tv-shows';
    onGoHome: () => void;
    onToggleGuide: () => void;
    onImport: (file: File) => void;
    onExport: () => void;
    onReset: () => void;
    onThemeSelect: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    view,
    onGoHome,
    onToggleGuide,
    onImport,
    onExport,
    onReset,
    onThemeSelect
}) => {
    return (
        <header className="py-8 text-center">
            <div className="container mx-auto pl-6 pr-2 sm:pl-8 sm:pr-3 lg:pl-12 lg:pr-4 relative">
                {(view === 'movies' || view === 'tv-shows') && (
                    <button
                        onClick={onGoHome}
                        className="absolute left-20 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-netflix-red hover:bg-netflix-red-dark rounded-full text-white transition-colors z-10 animate-fade-in"
                        aria-label="Go back to homepage"
                    >
                        <ChevronLeftIcon className="w-10 h-10" />
                    </button>
                )}
                <div className="absolute top-4 right-2 sm:right-3 lg:right-12">
                    <ProfileMenu
                        onImport={onImport}
                        onExport={onExport}
                        onReset={onReset}
                        onThemeSelect={onThemeSelect}
                    />
                </div>
                <h1
                    className="text-6xl md:text-7xl font-bold text-netflix-red uppercase cursor-pointer hover:text-netflix-red-dark transition-colors duration-300"
                    onClick={onGoHome}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onGoHome();
                        }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label="VidFast Link Generator, Go to homepage"
                >
                    VidFast Link Generator
                </h1>
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto mt-2">
                    Quickly find any movie or TV show and generate a direct VidFast streaming link.
                </p>
                <button
                    onClick={onToggleGuide}
                    className="mt-4 inline-flex items-center text-netflix-red border border-netflix-red/50 rounded-full px-5 py-2 text-md transition-colors hover:bg-netflix-red/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-netflix-red"
                >
                    {view === 'how-to-use' ? (
                        <>
                            <CloseIcon className="w-5 h-5 mr-2" />
                            Close Guide
                        </>
                    ) : (
                        <>
                            <BookOpenIcon className="w-5 h-5 mr-2" />
                            Guide to use this site
                        </>
                    )}
                </button>
            </div>
        </header>
    );
};

export default AppHeader;
