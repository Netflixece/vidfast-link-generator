

import React, { useState } from 'react';
import { SpinnerIcon } from './Icons';

const UpdateFromLink: React.FC<{ onUpdate: (url: string) => void; isUpdating: boolean }> = ({ onUpdate, isUpdating }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (url.trim() && !isUpdating) {
            onUpdate(url);
            setUrl('');
        }
    };

    return (
        <div className="mt-16 mb-8 max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-white mb-2">
                Add or Update from Link
            </h3>
            <p className="text-neutral-400 mb-4">
                Paste a VidFast link for any movie or episode. We'll add it to your Continue Watching list or update your progress if it's already there.
            </p>
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste VidFast link here..."
                    className="w-full pl-5 pr-32 py-3 text-base bg-neutral-800 text-white border-2 border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red transition-colors"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button
                        type="submit"
                        className="bg-netflix-red hover:bg-netflix-red-dark text-white font-bold py-2 px-5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-24"
                        disabled={!url.trim() || isUpdating}
                        aria-label="Update progress from link"
                    >
                        {isUpdating ? <SpinnerIcon className="w-5 h-5" /> : 'Update'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateFromLink;
