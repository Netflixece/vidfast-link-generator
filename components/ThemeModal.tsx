import React, { useState, useMemo } from 'react';
import type { ColorInfo } from '../types';
import { CloseIcon } from './Icons';
import { PREDEFINED_THEMES, CSS_COLORS } from '../constants';

interface ThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: ColorInfo;
    onThemeChange: (theme: ColorInfo) => void;
}

const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const presetNameOverrides: { [key: string]: string } = {
        '#00A8E1': 'Prime Blue',
        '#3DBB3D': 'Hulu Green',
    };

    const filteredColors = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const lowercasedQuery = searchQuery.toLowerCase();
        return CSS_COLORS.filter(
            color =>
                color.name.toLowerCase().includes(lowercasedQuery) ||
                color.hex.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery]);

    if (!isOpen) return null;

    const handleSelectTheme = (theme: ColorInfo) => {
        onThemeChange(theme);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 animate-fade-in-fast" onClick={onClose}>
            <div
                className="bg-netflix-dark rounded-xl shadow-2xl w-full max-w-2xl text-white animate-zoom-in flex flex-col h-[90vh] max-h-[700px]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 flex justify-center items-center border-b border-neutral-700/50 flex-shrink-0 relative">
                    <h2 className="text-2xl font-bold">Player Theme</h2>
                    <button onClick={onClose} className="absolute top-1/2 right-6 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-grow overflow-y-auto">
                    {/* Current Theme */}
                    <div className="mb-8 flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-neutral-300 flex-shrink-0">Current Theme:</h3>
                        <div 
                            className="w-7 h-7 rounded-full flex-shrink-0 border-2 border-white/20"
                            style={{ backgroundColor: currentTheme.hex, border: currentTheme.hex === '#FFFFFF' ? '1px solid #4A5568' : 'none' }}
                        />
                        <p className="font-semibold text-white truncate">{currentTheme.name}</p>
                        <p className="text-sm text-neutral-400 font-mono">{currentTheme.hex}</p>
                    </div>

                    {/* Predefined Themes */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-neutral-300 mb-4">Presets</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
                            {PREDEFINED_THEMES.map(theme => {
                                const presetName = presetNameOverrides[theme.hex.toUpperCase()] || theme.name;
                                return (
                                <button
                                    key={theme.hex}
                                    title={presetName}
                                    onClick={() => handleSelectTheme(theme)}
                                    className="flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors hover:bg-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-netflix-dark focus:ring-netflix-red"
                                    aria-label={`Select ${presetName} theme`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full transition-transform transform hover:scale-110 ${currentTheme.hex === theme.hex ? 'ring-2 ring-white' : ''}`}
                                        style={{ backgroundColor: theme.hex, border: theme.hex === '#FFFFFF' ? '1px solid #4A5568' : 'none' }}
                                    />
                                    <span className="text-xs font-semibold text-white truncate w-full">{presetName}</span>
                                    <span className="text-xs text-neutral-400 font-mono">{theme.hex}</span>
                                </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Custom Color Search */}
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-300 mb-3">Custom Color</h3>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or hex code (e.g., SkyBlue or #87CEEB)"
                            className="w-full pl-4 pr-4 py-2 text-base bg-neutral-800 text-white border-2 border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red transition-colors"
                        />
                    </div>
                     {searchQuery.trim() && (
                        <div className="mt-4 space-y-2 pr-2 overflow-y-auto max-h-[calc(100%-350px)]">
                            {filteredColors.length > 0 ? (
                                filteredColors.map(color => (
                                    <div
                                        key={color.hex}
                                        onClick={() => handleSelectTheme(color)}
                                        className="flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:bg-neutral-700/80 hover:border-neutral-600"
                                    >
                                        <div 
                                            className="w-6 h-6 rounded-full flex-shrink-0 mr-4 border border-white/20"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-white">{color.name}</p>
                                        </div>
                                        <p className="text-sm text-neutral-500 font-mono">{color.hex}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-neutral-500 py-4">No colors found.</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-neutral-700/50 flex-shrink-0 bg-netflix-dark/50 text-center">
                    <button 
                        onClick={onClose}
                        className="bg-netflix-red hover:bg-netflix-red-dark text-white font-bold py-2 px-8 rounded-md transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeModal;
