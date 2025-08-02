import React from 'react';
import { SpinnerIcon, CheckIcon } from './Icons';

interface UpdateFromLinkProps {
    value: string;
    onChange: (url: string) => void;
    status: 'idle' | 'loading' | 'success';
    isFadingOut: boolean;
    variant?: 'default' | 'compact';
}

const UpdateFromLink: React.FC<UpdateFromLinkProps> = ({ value, onChange, status, isFadingOut, variant = 'default' }) => {
    
    if (variant === 'compact') {
      return (
        <div className="relative max-w-lg mx-auto">
            <input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Paste VidFast link here..."
                className={`w-full pl-5 pr-12 py-3 text-base bg-neutral-800 text-white border-2 border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red transition-colors disabled:opacity-70 ${isFadingOut ? 'animate-fade-out-input' : ''}`}
                disabled={status === 'loading'}
                aria-label="Paste link to add or update"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                {status === 'loading' && <SpinnerIcon className="w-6 h-6 text-netflix-red" />}
                {status === 'success' && <CheckIcon className="w-6 h-6 text-green-500" />}
            </div>
        </div>
      )
    }

    return (
        <div className="mt-16 mb-8 max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-white mb-2">
                Add or Update from Link
            </h3>
            <p className="text-neutral-400 mb-4">
                Paste a VidFast link for any movie or episode. We'll add it to your Continue Watching list or update your progress if it's already there.
            </p>
            <div className="relative">
                <input
                    type="url"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Paste VidFast link here"
                    className={`w-full pl-5 pr-12 py-3 text-base bg-neutral-800 text-white border-2 border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red transition-colors disabled:opacity-70 ${isFadingOut ? 'animate-fade-out-input' : ''}`}
                    disabled={status === 'loading'}
                    aria-label="Paste link to add or update"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    {status === 'loading' && <SpinnerIcon className="w-6 h-6 text-netflix-red" />}
                    {status === 'success' && <CheckIcon className="w-6 h-6 text-green-500" />}
                </div>
            </div>
        </div>
    );
};

export default UpdateFromLink;
