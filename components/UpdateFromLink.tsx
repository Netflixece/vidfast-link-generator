
import React, { useState } from 'react';
import { SpinnerIcon } from './Icons';

const UpdateFromLink: React.FC<{ onUpdate: (url: string) => void; isUpdating: boolean }> = ({ onUpdate, isUpdating }) => {
    const [url, setUrl] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setUrl(newUrl);

        const trimmedUrl = newUrl.trim();
        if (!trimmedUrl || isUpdating) {
            return;
        }

        // Regexes to match complete VidFast links.
        // These cover all formats handled by `handleUpdateFromLink` in App.tsx.
        const validTvRegex = /vidfast\.pro\/tv\/\d+\/\d+\/\d+/;
        const movieRegex = /vidfast\.pro\/movie\/\d+/;
        const baseTvRegex = /vidfast\.pro\/tv\/\d+\/?($|\?.*)/;

        if (validTvRegex.test(trimmedUrl) || movieRegex.test(trimmedUrl) || baseTvRegex.test(trimmedUrl)) {
            onUpdate(trimmedUrl);
            setUrl(''); // Clear the input after initiating the update
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
            <div className="relative">
                <input
                    type="url"
                    value={url}
                    onChange={handleChange}
                    placeholder="Paste VidFast link here"
                    className="w-full pl-5 pr-12 py-3 text-base bg-neutral-800 text-white border-2 border-neutral-700 rounded-full focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red transition-colors disabled:opacity-70"
                    disabled={isUpdating}
                    aria-label="Paste link to add or update"
                />
                {isUpdating && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <SpinnerIcon className="w-6 h-6 text-netflix-red" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdateFromLink;
